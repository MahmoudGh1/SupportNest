import prisma from "src/config/prisma.js";
import { model } from "../config/langChain.js";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { AgentTier, MessageRole, MessageTier, ApiAuthType, HttpMethod } from "generated/prisma/enums.js";
import { AgentAction } from "generated/prisma/enums.js";
import type { ToolDefinition, BusinessApiConfig } from "generated/prisma/client.js";
import type { MemoryMessage } from "../utils/conversationMemory.utils.js";
import { appendToMemory } from "../utils/conversationMemory.utils.js";
import type { ConversationMessage, PipelineContext, TierResponse } from "src/types/agent.types.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToolParameter {
	name: string;
	type: "string" | "number" | "boolean";
	required: boolean;
	location: "path" | "query" | "body";
	description: string;
	"x-supportnest-type"?: string;
}

export type Tier1ActionType = AgentAction | "NEEDS_AUTH";

export interface Tier1Result {
	responseText: string;
	action: Tier1ActionType;
	loginUrl: string | null;
	toolsUsed: string[];
	tier: MessageTier;
	agentLog: {
		tier: AgentTier;
		confidenceScore: number;
		latencyMs: number;
		tokensUsed: number;
	};
}

// ─── Auth header builder ──────────────────────────────────────────────────────

function buildAuthHeaders(config: BusinessApiConfig): Record<string, string> {
	switch (config.authType) {
		case ApiAuthType.BEARER:
			return { Authorization: `Bearer ${config.authValue}` };
		case ApiAuthType.API_KEY:
			return { [config.headerName ?? "x-api-key"]: config.authValue };
		case ApiAuthType.BASIC:
			return {
				Authorization: `Basic ${Buffer.from(config.authValue).toString("base64")}`,
			};
		default:
			return {};
	}
}

// ─── Build one LangChain tool from a ToolDefinition row ───────────────────────

function buildTool(toolDef: ToolDefinition, apiConfig: BusinessApiConfig): DynamicStructuredTool {
	const parameters = toolDef.parameters as unknown as ToolParameter[];

	const schemaShape: Record<string, z.ZodTypeAny> = {};
	for (const param of parameters) {
		// if (param["x-supportnest-type"] === "login") continue; // skip login meta-param
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

				const url = new URL(`${apiConfig.baseUrl}${resolvedPath}`);
				for (const [k, v] of Object.entries(queryParams)) url.searchParams.set(k, v);

				const headers: Record<string, string> = {
					"Content-Type": "application/json",
					Accept: "application/json",
					...buildAuthHeaders(apiConfig),
				};
				console.log(url);

				const fetchOptions: RequestInit = { method: toolDef.method, headers };

				if (toolDef.method !== HttpMethod.GET && toolDef.method !== HttpMethod.DELETE && Object.keys(bodyParams).length > 0) {
					fetchOptions.body = JSON.stringify(bodyParams);
				}

				const response = await fetch(url.toString(), fetchOptions);
				const data = (await response.json()) as { message?: string } | null;

				if (!response.ok) {
					return JSON.stringify({
						error: true,
						status: response.status,
						message: data?.message ?? "Request failed",
					});
				}

				return JSON.stringify(data);
			} catch (err) {
				console.error(`[Tier1 Tool Error] ${toolDef.name}:`, err);
				return JSON.stringify({
					error: true,
					message: err instanceof Error ? err.message : "Tool execution failed",
				});
			}
		},
	});
}

// ─── Find the LOGIN tool (tagged x-supportnest-type: "login") ─────────────────

function findLoginTool(toolDefinitions: ToolDefinition[]): ToolDefinition | null {
	return (
		toolDefinitions.find((t) => {
			const params = t.parameters as unknown as ToolParameter[];
			return params?.some((p) => p["x-supportnest-type"] === "login");
		}) ?? null
	);
}

function buildLoginUrl(loginTool: ToolDefinition, apiConfig: BusinessApiConfig, conversationId: string): string {
	const url = new URL(`${apiConfig.baseUrl}${loginTool.path}`);
	url.searchParams.set("state", conversationId); // org's site reads this to know which conversation to resume
	return url.toString();
}

// ─── Response builder (same shape as Tier 0) ─────────────────────────────────

function buildResponse(responseText: string, action: Tier1ActionType, confidenceScore: number, tokensUsed: number, latencyMs: number, toolsUsed: string[] = [], loginUrl: string | null = null): Tier1Result {
	return {
		responseText,
		action,
		loginUrl,
		toolsUsed,
		tier: MessageTier.TIER1,
		agentLog: {
			tier: AgentTier.TIER1,
			confidenceScore,
			latencyMs,
			tokensUsed,
		},
	};
}

export async function runTier1Agent(context: PipelineContext): Promise<TierResponse> {
	console.log("[Tier1] starting");
	const { organizationId, latestMessage, conversationHistory, conversationId } = context;

	// 1. Load org's API config + active tool definitions
	const apiConfig = await prisma.businessApiConfig.findUnique({
		where: { organizationId },
		include: { toolDefinitions: { where: { isActive: true } } },
	});

	if (!apiConfig || apiConfig.toolDefinitions.length === 0) {
		return {
			tier: MessageTier.TIER1,
			responseText: "",
			agentLog: { confidenceScore: 0, tokensUsed: 0 },
		};
	}

	// 2. Build LangChain tools from DB rows
	const tools = apiConfig.toolDefinitions.map((t) => buildTool(t, apiConfig));
	const modelWithTools = model.bindTools(tools);

	// 3. Build conversation history
	const historyMessages = conversationHistory.flatMap((msg): BaseMessage[] => {
		if (msg.role === "CUSTOMER") return [new HumanMessage(msg.content)];
		if (msg.role === "AI") return [new AIMessage(msg.content)];
		return [];
	});

	const toolDescriptions = apiConfig.toolDefinitions.map((t) => `- ${t.name}: ${t.description}`).join("\n");

	// 4. First LLM call — model reads the question and picks the right tool
	const firstResponse = await modelWithTools.invoke([
		new SystemMessage(`
You are a customer support agent with access to business APIs.

TONE:
- Angry/frustrated → calm, apologetic, reassuring. Acknowledge the feeling first.
- Happy → warm, match their energy.
- Confused → patient and simple.

STYLE:
- Short and natural. Texting style, not an essay.
- No bullet points, no lists, no structured formatting.
- Sound like a real person texting, not a call center script.

AVAILABLE TOOLS:
${toolDescriptions}

INSTRUCTIONS:
- Read the customer's question carefully.
- If a tool matches, call it. Only call tools that are relevant to the question.
- If no tool matches, respond with this exact JSON and nothing else:
  { "agentText": "I don't have access to that information.", "confidenceScore": 0 }
- Never make up data. Never call a tool with invented arguments.
- Always base your response on real tool output.

    `),
		...historyMessages,
		new HumanMessage(latestMessage),
	]);

	const toolCalls = firstResponse.tool_calls ?? [];
	const firstTokens = firstResponse.usage_metadata?.total_tokens ?? 0;

	console.log(`[Tier1] first response tool_calls: ${JSON.stringify(toolCalls)}`);

	// 5. No tool selected — model couldn't match any tool to the question
	if (toolCalls.length === 0) {
		return {
			tier: MessageTier.TIER1,
			responseText: "",
			agentLog: {
				confidenceScore: 0,
				tokensUsed: firstTokens,
			},
		};
	}

	// 6. Execute selected tool calls in parallel for better performance
	const toolPromises = toolCalls.map(async (toolCall) => {
		const tool = tools.find((t) => t.name === toolCall.name);
		if (!tool) return null;

		console.log(`[Tier1] calling tool: ${toolCall.name} with args: ${JSON.stringify(toolCall.args)}`);
		try {
			const result = await tool.invoke(toolCall.args as Record<string, unknown>);
			return `Tool: ${toolCall.name}\nResult: ${result}`;
		} catch (error) {
			console.error(`[Tier1] Error executing tool ${toolCall.name}:`, error);
			return `Tool: ${toolCall.name}\nResult: Error executing tool.`;
		}
	});

	const resolvedResults = await Promise.all(toolPromises);
	const toolResults = resolvedResults.filter((res): res is string => res !== null);

	// 7. Second LLM call — Enforce native JSON output format if supported by provider
	const jsonModel = model.withStructuredOutput(
		z.object({
			agentText: z.string(),
			confidenceScore: z.number(),
		}),
		{ name: "tier1_response" },
	);

	const secondResponse = await jsonModel.invoke([
		new SystemMessage(`
You are a customer support agent. Use the tool results below to write a reply.

CRITICAL: You MUST base your response exclusively on the actual data in the Tool Results.
- If the data contains a list of items, mention specific real values from it (names, IDs, counts).
- Do NOT invent, paraphrase, or substitute example names for real ones.
- If the result is a long list, summarize the count and highlight a few real entries by name.
- If the result is empty or an error, say so honestly.

LANGUAGE & DIALECT:
- Detect the language the customer used and respond in the exact same language and dialect.

TONE:
- Match the customer's emotional tone. Angry → calm and apologetic first.

STYLE:
- Short and natural. Texting style.
- For lists of data, it's okay to briefly mention a few real items by name — don't invent them.

ANSWER ROLES:
- Don't ever hallucinate or fabricate data.
- only answer from what you have got from live data
- Always think and response like a human will do.
- if there are any way to filter and provide a link to go to the specific thing that the customer asked for then do it without hesitating, and give him a complete url + path.
- don't invent or fabricate any names, or anything if it is not in the call of the tools.
- Make your response bypass this quality assurance rules:
	1- RELEVANT — directly addresses what the customer asked, does not answer a different question
	2- COMPLETE — does not trail off, is not vague, gives the customer something actionable
	3- CONFIDENT — does not say "I'm not sure" or "maybe" without providing real substance
	4- ACCURATE TONE — professional, empathetic, not robotic or rude
	5- NO OBVIOUS FABRICATION — does not contain suspicious specifics like invented phone numbers, made-up URLs, or contradicts itself within the same response. 
- don't invent any name or any data if it is not in the live data you get from the tool.

LINKS:
	- Never include raw API or Swagger URLs in your response.
	- If you want to point the customer somewhere, describe it naturally (e.g. "you can browse all available pets on our website") or omit the link entirely.
	- Only include a URL if it's a clean, customer-facing page.
	- If the customer asks for a photo or image of a pet, include the image URL from the tool result in your response using this exact format on its own line: [IMAGE: <url>]
	- Only use URLs that exist in the tool results. Never invent URLs.

Respond ONLY with valid JSON matching this schema:
{ "agentText": string, "confidenceScore": number }

confidenceScore rules:
- 0.9+ if the tool returned clear complete data and the response uses it faithfully
- 0.6–0.8 if partial data or minor uncertainty
- below 0.6 if the result was an error or empty

Tool Results:
${toolResults.join("\n\n")}
    `),
		new HumanMessage(latestMessage),
	]);

	// const rawContent = typeof secondResponse.content === "string" ? secondResponse.content : (secondResponse.content[0] as { text: string }).text;

	const totalTokens = firstTokens + (secondResponse.usage_metadata?.total_tokens ?? 0);

	// 8. Parse response safely
	let agentText = "";
	let confidenceScore = 0;

	try {
		// Cleans markdown blocks if JSON output mode wasn't 100% strict
		// const cleanedJson = rawContent.replace(/^```json\s*|```$/gi, "").trim();
		// const parsed = JSON.parse(cleanedJson) as {
		// 	agentText: string;
		// 	confidenceScore: number;
		// };
		agentText = secondResponse.agentText;
		confidenceScore = secondResponse.confidenceScore;
	} catch (e) {
		console.warn("[Tier1] Failed to parse JSON response from second LLM call, falling back to raw content.", e);
		agentText = secondResponse.agentText;
		confidenceScore = 0.4; // Fallback score due to parsing failure
	}

	console.log(`[Tier1] confidence: ${confidenceScore} | text: ${agentText}`);
	await appendToMemory(conversationId, latestMessage, agentText);
	return {
		tier: MessageTier.TIER1,
		responseText: agentText,
		agentLog: {
			confidenceScore,
			tokensUsed: totalTokens,
		},
		toolResults
	};
}
