import prisma from "src/config/prisma.js";
import { tier2Model } from "../config/langChain.js";
import { HumanMessage, SystemMessage, AIMessage, ToolMessage, BaseMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { MessageTier } from "generated/prisma/enums.js";
import { ApiAuthType, HttpMethod } from "generated/prisma/enums.js";
import type { ToolDefinition, BusinessApiConfig } from "generated/prisma/client.js";
import { appendToMemory } from "../utils/conversationMemory.utils.js";
import type { PipelineContext, TierResponse } from "src/types/agent.types.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToolParameter {
	name: string;
	type: "string" | "number" | "boolean";
	required: boolean;
	location: "path" | "query" | "body";
	description: string;
	"x-supportnest-type"?: string;
}

const MAX_TOOL_CALLS = 5;

// ─── Auth header builder (same pattern as Tier1) ─────────────────────────────

function buildAuthHeaders(config: BusinessApiConfig): Record<string, string> {
	switch (config.authType) {
		case ApiAuthType.BEARER:
			return { Authorization: `Bearer ${config.authValue}` };
		case ApiAuthType.API_KEY:
			return { [config.headerName ?? "x-api-key"]: config.authValue };
		case ApiAuthType.BASIC:
			return { Authorization: `Basic ${Buffer.from(config.authValue).toString("base64")}` };
		default:
			return {};
	}
}

// ─── Build one LangChain tool from a ToolDefinition row (same pattern as Tier1) ──

function buildTool(toolDef: ToolDefinition, apiConfig: BusinessApiConfig): DynamicStructuredTool {
	const parameters = toolDef.parameters as unknown as ToolParameter[];

	const schemaShape: Record<string, z.ZodTypeAny> = {};
	for (const param of parameters) {
		let field: z.ZodTypeAny = param.type === "number" ? z.number() : param.type === "boolean" ? z.boolean() : z.string();
		field = field.describe(param.description);
		schemaShape[param.name] = param.required ? field : field.optional();
	}

	return new DynamicStructuredTool({
		name: toolDef.name,
		description: toolDef.description,
		schema: z.object(schemaShape),

		func: async (args: Record<string, unknown>) => {
			try {
				const parameters = toolDef.parameters as unknown as ToolParameter[];
				let resolvedPath = toolDef.path;
				const queryParams: Record<string, string> = {};
				const bodyParams: Record<string, unknown> = {};

				for (const param of parameters) {
					if (param["x-supportnest-type"] === "login") continue;
					const value = args[param.name];
					if (value === undefined || value === null) continue;

					if (param.location === "path") {
						resolvedPath = resolvedPath.replace(`{${param.name}}`, String(value));
					} else if (param.location === "query") {
						queryParams[param.name] = String(value);
					} else if (param.location === "body") {
						bodyParams[param.name] = value;
					}
				}
				const normalizedBaseUrl = apiConfig.baseUrl.replace(/\/+$/, ""); // strip trailing slashes
				const normalizedPath = resolvedPath.startsWith("/") ? resolvedPath : `/${resolvedPath}`;
				const url = new URL(`${normalizedBaseUrl}${normalizedPath}`);
				// const url = new URL(`${apiConfig.baseUrl}${resolvedPath}`);
				for (const [k, v] of Object.entries(queryParams)) url.searchParams.set(k, v);
				console.log(`[Tier2ToolChain] Calling: ${toolDef.method} ${url.toString()}`); // ADD THIS

				const headers: Record<string, string> = {
					"Content-Type": "application/json",
					Accept: "application/json",
					...buildAuthHeaders(apiConfig),
				};

				const fetchOptions: RequestInit = { method: toolDef.method, headers };
				if (toolDef.method !== HttpMethod.GET && toolDef.method !== HttpMethod.DELETE && Object.keys(bodyParams).length > 0) {
					fetchOptions.body = JSON.stringify(bodyParams);
				}

				// const response = await fetch(url.toString(), fetchOptions);
				// const data = (await response.json()) as { message?: string } | null;
				// console.log(`[Tier2ToolChain] Response (${response.status}):`, JSON.stringify(data).slice(0, 500)); // ADD THIS

				// if (!response.ok) {
				// 	return JSON.stringify({ error: true, status: response.status, message: data?.message ?? "Request failed" });
				// }

				// return JSON.stringify(data);

				const contentType = response.headers.get("content-type") ?? "";
				const rawBody = await response.text();
				
				if (!contentType.includes("application/json")) {
				    console.error(`[Tier2ToolChain Tool Error] ${toolDef.name}: non-JSON response (status ${response.status}, content-type "${contentType}")`);
				    return JSON.stringify({
				        error: true,
				        status: response.status,
				        message: `External API returned a non-JSON response (status ${response.status}). The endpoint may be unreachable, misconfigured, or behind a login wall.`,
				    });
				}
				
				let data: { message?: string } | null = null;
				try {
				    data = rawBody ? JSON.parse(rawBody) : null;
				} catch (parseErr) {
				    console.error(`[Tier2ToolChain Tool Error] ${toolDef.name}: failed to parse JSON body despite JSON content-type`, parseErr);
				    return JSON.stringify({ error: true, status: response.status, message: "External API response could not be parsed as JSON." });
				}
				
				console.log(`[Tier2ToolChain] Response (${response.status}):`, JSON.stringify(data).slice(0, 500));
				
				if (!response.ok) {
				    return JSON.stringify({ error: true, status: response.status, message: data?.message ?? "Request failed" });
				}
				
				return JSON.stringify(data);
			} catch (err) {
				console.error(`[Tier2ToolChain Tool Error] ${toolDef.name}:`, err);
				return JSON.stringify({ error: true, message: err instanceof Error ? err.message : "Tool execution failed" });
			}
		},
	});
}

// ─── Forced final-decision schema ─────────────────────────────────────────────
// "No tool call" alone is ambiguous between "I have the answer" and "I gave up" —
// so the model must explicitly say which one happened.

const finalAnswerSchema = z.object({
	agentText: z.string().describe("The reply to send to the customer. Empty string if not resolved."),
	resolved: z.boolean().describe("true only if real tool data was found that answers the customer's request. false if nothing matching was found, or the request can't be fulfilled with available tools."),
	confidenceScore: z.number(),
});

export async function runTier2ToolChainAgent(context: PipelineContext): Promise<TierResponse> {
	const { organizationId, latestMessage, conversationHistory, conversationId } = context;

	// 1. Load org's API config + ALL active tools (public + private)
	const apiConfig = await prisma.businessApiConfig.findUnique({
		where: { organizationId },
		include: { toolDefinitions: { where: { isActive: true } } },
	});

	if (!apiConfig || apiConfig.toolDefinitions.length === 0) {
		// No tools to chain with — signal "not resolved" exactly like Tier1 does
		// when no tool matches. The router's reviewer will reject this empty
		// response and escalate to HUMAN via the existing, unmodified path.
		return {
			tier: MessageTier.TIER2,
			responseText: "",
			agentLog: { confidenceScore: 0, tokensUsed: 0 },
		};
	}

	const tools = apiConfig.toolDefinitions.map((t) => buildTool(t, apiConfig));
	const toolMap = new Map(tools.map((t) => [t.name, t]));
	const modelWithTools = tier2Model.bindTools(tools);

	const toolDescriptions = apiConfig.toolDefinitions.map((t) => `- ${t.name}: ${t.description}`).join("\n");

	const historyMessages = conversationHistory.flatMap((msg): BaseMessage[] => {
		if (msg.role === "CUSTOMER") return [new HumanMessage(msg.content)];
		if (msg.role === "AI") return [new AIMessage(msg.content)];
		return [];
	});

	const systemPrompt = new SystemMessage(`
		You are a customer support agent handling a request that may require multiple steps to fully resolve.

		AVAILABLE TOOLS:
		${toolDescriptions}

		CRITICAL — IDS VS NAMES:
		- The customer describes things by name, description, or wording — NOT by ID. You do not have an item's real ID until a tool call returns it to you.
		- NEVER pass the customer's wording directly into an ID-shaped parameter (e.g. petId, orderId, productId, userId). IDs are numbers or codes that come ONLY from a previous tool result — never from guessing, never from the customer's message itself.
		- If you don't yet have a real ID for what the customer is asking about, your first move is to call a listing/filtering tool (e.g. by status, category, or type) to get real items with real IDs — not a detail/lookup tool.

		HOW TO WORK:
		- Some questions require chaining multiple tool calls. Example: to find a specific item by name when no "search by name" tool exists — first call a tool that lists or filters items, scan that result for a name/description match, extract its real ID, THEN call a detail/lookup tool using that real ID.
		- Look carefully at each tool result before deciding your next step. Use only real IDs and values that appeared in a previous tool result — never invent them.
		- Only call a tool when it's genuinely needed to answer the question. Don't call tools for greetings or unrelated chat.
		- You may call multiple tools across multiple turns to fully resolve the request, but only as many as actually needed.
		- Never fabricate data that didn't come from a tool result.

		WHEN A TOOL CALL FAILS OR RETURNS AN ERROR:
		- Do not give up immediately. An error often means you skipped a step — most commonly, you called a detail/lookup tool with something that wasn't actually a real ID yet.
		- Before concluding the request can't be fulfilled, check: did you look up the real ID first? If not, do that now, then retry the correct tool with the real ID you find.
		- Only conclude the request can't be fulfilled after you've actually tried the correct lookup-then-detail sequence and the item genuinely isn't there.
		- An empty result (e.g. an empty list) from a listing/filtering tool is not the same as "not found" — it may mean you picked the wrong filter or field to search by. If there are other listing/filtering tools available that search by a different field (e.g. status instead of tags, or category instead of name), try one of those before concluding the item doesn't exist.
		- Only conclude the request can't be fulfilled after you've tried at least two different reasonable lookup approaches, if more than one listing/filtering tool is available.

		TONE:
		- Angry/frustrated → calm, apologetic, reassuring. Acknowledge the feeling first.
		- Confused → patient and simple.

		STYLE:
		- Short and natural, texting style. No bullet points or lists.
		- When sharing information from a tool result, write it as a natural sentence a helpful person would say — not a labeled list of fields. Say "Yes, we have it — it's called X, it's currently available" rather than "ID is X, name is Y, status is Z."
		- Still include the details that matter to the customer (name, availability, price, description, etc.) — just say them the way a person would talk, not the way a database would print them.
		- Skip raw internal identifiers (numeric IDs, internal category/tag object structures) unless the customer specifically asked for an ID.

		LANGUAGE & DIALECT:
		- Respond in the exact language/dialect of the customer's most recent message.

		LINKS:
		- Never include raw API or Swagger URLs.
		- If a clean customer-facing page exists for the item, include it naturally.
		- If the customer asks for a photo, include the image URL from tool results on its own line as [IMAGE: <url>].
		- Only use URLs that exist in tool results — never invent them.
		`);

	const messages: BaseMessage[] = [systemPrompt, ...historyMessages, new HumanMessage(latestMessage)];

	let totalTokens = 0;
	let toolCallCount = 0;

	// ─── TOOL-CHAINING LOOP ──────────────────────────────────────────────────────
	while (toolCallCount < MAX_TOOL_CALLS) {
		const response = await modelWithTools.invoke(messages);
		totalTokens += response.usage_metadata?.total_tokens ?? 0;

		const toolCalls = response.tool_calls ?? [];
		console.log(`[Tier2ToolChain] Loop iteration, tool_calls:`, JSON.stringify(toolCalls)); // ADD THIS

		if (toolCalls.length === 0) {
			messages.push(response);
			break;
		}

		messages.push(response);
		toolCallCount += toolCalls.length;

		let anyEmptyArrayResult = false;

		const toolResults = await Promise.all(
			toolCalls.map(async (toolCall) => {
				const tool = toolMap.get(toolCall.name);
				const result = tool ? await tool.invoke(toolCall.args as Record<string, unknown>).catch((err: Error) => JSON.stringify({ error: true, message: err.message })) : JSON.stringify({ error: true, message: `Tool ${toolCall.name} not found` });

				// Detect an empty array result — the signal that a listing/filtering
				// tool found nothing, which may mean the wrong field/filter was used,
				// not that the item doesn't exist.
				try {
					const parsed = JSON.parse(result);
					if (Array.isArray(parsed) && parsed.length === 0) {
						anyEmptyArrayResult = true;
					}
				} catch {
					// not JSON or not an array — ignore, no special handling needed
				}

				return new ToolMessage({
					content: result,
					tool_call_id: toolCall.id ?? "",
				});
			}),
		);

		messages.push(...toolResults);

		// Mechanical nudge — injected fresh at the exact moment it's needed,
		// rather than relying on the model to recall a rule from the system
		// prompt several turns back.
		const otherListingToolNames = apiConfig.toolDefinitions.filter((t) => !toolCalls.some((tc) => tc.name === t.name)).map((t) => t.name);

		if (anyEmptyArrayResult && otherListingToolNames.length > 0) {
			messages.push(new HumanMessage(`That search returned no results. This may mean you searched by the wrong field, not that the item doesn't exist. Other tools you haven't tried yet: ${otherListingToolNames.join(", ")}. Try one of these with a different search approach before concluding nothing was found.`));
		}
	}

	// ─── FINAL STRUCTURED DECISION ────────────────────────────────────────────────
	const jsonModel = tier2Model.withStructuredOutput(finalAnswerSchema, { name: "tier2_toolchain_response" });

	const finalResponse = await jsonModel.invoke([
		...messages,
		new HumanMessage(`
        Based on everything above, decide:
		- If you found real data that answers the customer's question: set resolved=true and write agentText.
		- agentText should sound like a helpful person confirming what they found — naturally phrased, professional, and including the relevant details (name, availability, price, etc.). Do not format it as a list of labeled fields like "ID: X, Name: Y, Status: Z." Write it as a real sentence, the way a person would say it.
		- If nothing matches what the customer asked for, or the request can't be fulfilled with available tools: set resolved=false and leave agentText empty.
		- If you stopped because you hit the maximum number of tool calls without finding an answer: set resolved=false.
		Never fabricate an answer just to mark resolved=true.
    `),
	]);

	totalTokens += finalResponse.usage_metadata?.total_tokens ?? 0;

	if (!finalResponse.resolved) {
		// Not resolved — same signal shape Tier1 uses for "couldn't do this."
		// No ticket creation here; the router's existing review + HUMAN
		// short-circuit (unchanged) takes over from here, exactly as it
		// already does for every other path that reaches HUMAN today.
		return {
			tier: MessageTier.TIER2,
			responseText: "",
			agentLog: { confidenceScore: 0, tokensUsed: totalTokens },
		};
	}

	await appendToMemory(conversationId, latestMessage, finalResponse.agentText);

	return {
		tier: MessageTier.TIER2,
		responseText: finalResponse.agentText,
		agentLog: { confidenceScore: finalResponse.confidenceScore, tokensUsed: totalTokens },
	};
}
