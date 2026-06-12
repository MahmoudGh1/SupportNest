import prisma from "src/config/prisma.js";
import { model } from "../config/langChain.js";
import {
	HumanMessage,
	SystemMessage,
	AIMessage,
	BaseMessage,
} from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import {
	AgentTier,
	MessageRole,
	MessageTier,
	ApiAuthType,
	HttpMethod,
} from "generated/prisma/enums.js";
import { AgentAction } from "generated/prisma/enums.js";
import type {
	ToolDefinition,
	BusinessApiConfig,
} from "generated/prisma/client.js";
import type { MemoryMessage } from "../utils/conversationMemory.utils.js";
import { appendToMemory } from "../utils/conversationMemory.utils.js";
import type {
	ConversationMessage,
	PipelineContext,
	TierResponse,
} from "src/types/agent.types.js";

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

function buildTool(
	toolDef: ToolDefinition,
	apiConfig: BusinessApiConfig,
): DynamicStructuredTool {
	const parameters = toolDef.parameters as unknown as ToolParameter[];

	const schemaShape: Record<string, z.ZodTypeAny> = {};
	for (const param of parameters) {
		// if (param["x-supportnest-type"] === "login") continue; // skip login meta-param
		let field: z.ZodTypeAny =
			param.type === "number"
				? z.number()
				: param.type === "boolean"
					? z.boolean()
					: z.string();
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
				console.log(parameters);
				console.log(toolDef.name);
				let resolvedPath = toolDef.path;
				const queryParams: Record<string, string> = {};
				const bodyParams: Record<string, unknown> = {};

				for (const param of parameters) {
					if (param["x-supportnest-type"] === "login") continue;
					const value = args[param.name];
					if (value === undefined || value === null) continue;

					if (param.location === "path") {
						resolvedPath = resolvedPath.replace(
							`{${param.name}}`,
							String(value),
						);
					} else if (param.location === "query") {
						queryParams[param.name] = String(value);
					} else if (param.location === "body") {
						bodyParams[param.name] = value;
					}
				}

				const url = new URL(`${apiConfig.baseUrl}${resolvedPath}`);
				for (const [k, v] of Object.entries(queryParams))
					url.searchParams.set(k, v);

				const headers: Record<string, string> = {
					"Content-Type": "application/json",
					...buildAuthHeaders(apiConfig),
				};

				const fetchOptions: RequestInit = { method: toolDef.method, headers };

				if (
					toolDef.method !== HttpMethod.GET &&
					toolDef.method !== HttpMethod.DELETE &&
					Object.keys(bodyParams).length > 0
				) {
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
					message:
						err instanceof Error ? err.message : "Tool execution failed",
				});
			}
		},
	});
}

// ─── Find the LOGIN tool (tagged x-supportnest-type: "login") ─────────────────

function findLoginTool(
	toolDefinitions: ToolDefinition[],
): ToolDefinition | null {
	return (
		toolDefinitions.find((t) => {
			const params = t.parameters as unknown as ToolParameter[];
			return params?.some((p) => p["x-supportnest-type"] === "login");
		}) ?? null
	);
}

function buildLoginUrl(
	loginTool: ToolDefinition,
	apiConfig: BusinessApiConfig,
	conversationId: string,
): string {
	const url = new URL(`${apiConfig.baseUrl}${loginTool.path}`);
	url.searchParams.set("state", conversationId); // org's site reads this to know which conversation to resume
	return url.toString();
}

// ─── Response builder (same shape as Tier 0) ─────────────────────────────────

function buildResponse(
	responseText: string,
	action: Tier1ActionType,
	confidenceScore: number,
	tokensUsed: number,
	latencyMs: number,
	toolsUsed: string[] = [],
	loginUrl: string | null = null,
): Tier1Result {
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

// ─── Main ─────────────────────────────────────────────────────────────────────

// export async function runTier1Agent(
// 	question: string,
// 	organizationId: string,
// 	conversationId: string,
// 	customerId: string,
// 	conversationHistory: ConversationMessage[] = [],
// ): Promise<Tier1Result> {
// 	const startTime = Date.now();

// 	// 1. Load org's API config + active tool definitions
// 	const apiConfig = await prisma.businessApiConfig.findUnique({
// 		where: { organizationId },
// 		include: { toolDefinitions: { where: { isActive: true } } },
// 	});

// 	if (!apiConfig || apiConfig.toolDefinitions.length === 0) {
// 		return buildResponse(
// 			"I can't access account information right now.",
// 			"ESCALATED_TO_TIER2",
// 			0,
// 			0,
// 			Date.now() - startTime,
// 		);
// 	}

// 	// 2. Check if customer is anonymous
// 	const customer = await prisma.customer.findUnique({
// 		where: { id: customerId },
// 	});
// 	const isAnonymous =
// 		!customer || customer.isAnonymous || !customer.externalId;

// 	if (isAnonymous) {
// 		// 3. Anonymous → find the login tool and send the login link
// 		const loginTool = findLoginTool(apiConfig.toolDefinitions);

// 		if (!loginTool) {
// 			return buildResponse(
// 				"I need to verify your identity but no login method is configured.",
// 				"ESCALATED_TO_TIER2",
// 				0,
// 				0,
// 				Date.now() - startTime,
// 			);
// 		}

// 		const loginUrl = buildLoginUrl(loginTool, apiConfig, conversationId);
// 		const responseText =
// 			"To help you with your account I need to verify who you are first. Please log in using the link and come right back — I'll continue from where we left off.";

// 		return buildResponse(
// 			responseText,
// 			"NEEDS_AUTH",
// 			0,
// 			0,
// 			Date.now() - startTime,
// 			[],
// 			loginUrl,
// 		);
// 	}

// 	// 4. Identified customer — build callable tools (exclude login tool)
// 	const callableToolDefs = apiConfig.toolDefinitions.filter(
// 		(t) =>
// 			!(t.parameters as unknown as ToolParameter[])?.some(
// 				(p) => p["x-supportnest-type"] === "login",
// 			),
// 	);

// 	const tools = callableToolDefs.map((t) => buildTool(t, apiConfig));
// 	const modelWithTools = model.bindTools(tools);

// 	// 5. Build conversation history messages for LLM context
// 	const historyMessages = conversationHistory.flatMap((msg): BaseMessage[] => {
// 		if (msg.role === "CUSTOMER") return [new HumanMessage(msg.content)];
// 		if (msg.role === "AI") return [new AIMessage(msg.content)];
// 		return [];
// 	});

// 	const toolDescriptions = callableToolDefs
// 		.map((t) => `- ${t.name}: ${t.description}`)
// 		.join("\n");

// 	// 6. First LLM call — model picks which tool(s) to call
// 	const firstResponse = await modelWithTools.invoke([
// 		new SystemMessage(`
//       You are a customer support agent with access to the customer's account system.
//       Never reveal you are an AI or a bot.

//       CUSTOMER IDENTITY:
//       - Customer ID: ${customer.externalId}
//       - Customer name: ${customer.name ?? "unknown"}
//       - Use this ID automatically in any tool that requires a customer or user identifier.

//       LANGUAGE & DIALECT:
//       - Detect the language and dialect the user writes in and respond in the EXACT same language and dialect.
//       - Egyptian Arabic → Egyptian Arabic slang. Don't mix in formal Arabic.

//       TONE:
//       - Angry/frustrated → calm, apologetic, reassuring. Acknowledge the feeling first.
//       - Happy → warm, match their energy.
//       - Confused → patient and simple.

//       STYLE:
//       - Short and natural. Texting style, not an essay.
//       - No bullet points, no lists, no structured formatting.
//       - Sound like a real person texting, not a call center script.

//       AVAILABLE TOOLS:
//       ${toolDescriptions}

//       INSTRUCTIONS:
//       - Use the tools to fetch or update the customer's account data to answer their question.
//       - Always inject the customer ID automatically when a tool needs it.
//       - If no tool matches the question at all, respond with JSON: { "agentText": string, "confidenceScore": 0 }
//     `),
// 		...historyMessages,
// 		new HumanMessage(question),
// 	]);

// 	let finalResponseText = "";
// 	let confidenceScore = 0;
// 	let toolsUsed: string[] = [];
// 	let totalTokens =
// 		(firstResponse.usage_metadata as { total_tokens?: number } | undefined)
// 			?.total_tokens ?? 0;

// 	const toolCalls = firstResponse.tool_calls ?? [];

// 	if (toolCalls.length > 0) {
// 		// 7a. Execute each tool call against the org's real API
// 		const toolResults: string[] = [];

// 		for (const toolCall of toolCalls) {
// 			const tool = tools.find((t) => t.name === toolCall.name);
// 			if (!tool) continue;

// 			console.log(`[Tier1] calling tool: ${toolCall.name}`, toolCall.args);
// 			const result = await tool.invoke(
// 				toolCall.args as Record<string, unknown>,
// 			);
// 			toolResults.push(`Tool: ${toolCall.name}\nResult: ${result}`);
// 			toolsUsed.push(toolCall.name);
// 		}

// 		// 7b. Second LLM call — turn tool results into a natural customer reply
// 		const secondResponse = await model.invoke([
// 			new SystemMessage(`
//         You are a customer support agent. You just called tools to help a customer.
//         Use the tool results below to write a short, natural, friendly response.

//         LANGUAGE & DIALECT:
//         - Respond in the EXACT same language and dialect the customer used.
//         - Egyptian Arabic → Egyptian Arabic slang.

//         TONE:
//         - Match the customer's emotional tone. Angry → calm and apologetic first.

//         STYLE:
//         - Short and natural. Texting style. No bullet points or lists.

//         Return JSON only, no markdown, no backticks:
//         {
//           "agentText": string,
//           "confidenceScore": number
//         }

//         Tool Results:
//         ${toolResults.join("\n\n")}
//       `),
// 			new HumanMessage(question),
// 		]);

// 		const raw =
// 			typeof secondResponse.content === "string"
// 				? secondResponse.content
// 				: (secondResponse.content[0] as { text: string }).text;

// 		try {
// 			const cleaned = raw.replace(/```json|```/g, "").trim();
// 			const parsed = JSON.parse(cleaned) as {
// 				agentText: string;
// 				confidenceScore: number;
// 			};
// 			finalResponseText = parsed.agentText;
// 			confidenceScore = parsed.confidenceScore;
// 		} catch {
// 			finalResponseText = raw;
// 			confidenceScore = 0.5;
// 		}

// 		totalTokens +=
// 			(secondResponse.usage_metadata as { total_tokens?: number } | undefined)
// 				?.total_tokens ?? 0;
// 	} else {
// 		// 7c. No tool called — model couldn't match any tool to the question
// 		const raw =
// 			typeof firstResponse.content === "string"
// 				? firstResponse.content
// 				: (firstResponse.content[0] as { text: string }).text;

// 		try {
// 			const cleaned = raw.replace(/```json|```/g, "").trim();
// 			const parsed = JSON.parse(cleaned) as {
// 				agentText: string;
// 				confidenceScore: number;
// 			};
// 			finalResponseText = parsed.agentText;
// 			confidenceScore = parsed.confidenceScore;
// 		} catch {
// 			finalResponseText = raw;
// 			confidenceScore = 0;
// 		}
// 	}

// 	const latencyMs = Date.now() - startTime;
// 	const isResolved = toolsUsed.length > 0 && confidenceScore >= 0.6;
// 	const action: Tier1ActionType = isResolved
// 		? AgentAction.RESOLVED
// 		: AgentAction.ESCALATED_TO_TIER2;

// 	console.log(
// 		`[Tier1] tools: [${toolsUsed.join(", ")}] | confidence: ${confidenceScore} | action: ${action}`,
// 	);

// 	// 8. Append to Redis memory only when resolved (same pattern as Tier 0)
// 	if (isResolved) {
// 		await appendToMemory(conversationId, question, finalResponseText);
// 	}

// 	return buildResponse(
// 		finalResponseText,
// 		action,
// 		confidenceScore,
// 		totalTokens,
// 		latencyMs,
// 		toolsUsed,
// 	);
// }

export async function runTier1Agent(
	context: PipelineContext,
): Promise<TierResponse> {
	console.log("ask tier 1");
	const { organizationId, latestMessage, conversationHistory } = context;
	const startTime = Date.now();

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

	const tools = apiConfig.toolDefinitions.map((t) => buildTool(t, apiConfig));
	for (const tool of tools) {
		console.log({
			name: tool.name,
			description: tool.description?.slice(0, 80),
			schemaKeys: Object.keys(tool.schema.shape ?? {}),
		});
	}
	const modelWithTools = model.bindTools(tools, {
		tool_choice: "any", // force it to call at least one tool
	});
	const historyMessages = conversationHistory.flatMap((msg): BaseMessage[] => {
		if (msg.role === "CUSTOMER") return [new HumanMessage(msg.content)];
		if (msg.role === "AI") return [new AIMessage(msg.content)];
		return [];
	});

	const toolDescriptions = apiConfig.toolDefinitions
		.map((t) => `- ${t.name}: ${t.description}`)
		.join("\n");

	const firstResponse = await modelWithTools.invoke([
		new SystemMessage(`
        You are a customer support agent with access to business APIs.

      TONE:
      - Angry/frustrated → calm, apologetic, reassuring. Acknowledge the feeling first.
      - Happy → warm, match their energy.
      - Confused → patient and simple.

      STYLE
      - Short and natural. Texting style, not an essay.
      - No bullet points, no lists, no structured formatting.
      - Sound like a real person texting, not a call center script.

        AVAILABLE TOOLS:
        ${toolDescriptions}
        
        INSTRUCTIONS:
        - Use the available tools to answer the customer's question
        - If no tool matches the question, respond with this exact JSON:
          { "agentText": "I don't have access to that information.", "confidenceScore": 0 }
        - Never make up tool calls or data
				- You are an assistant with access to data via tools.
NEVER answer questions about any kind of data from memory.
ALWAYS call the appropriate tool first, then respond based on its output.
Even for general questions, call the tool to get current data.
    `),
		...historyMessages,
		new HumanMessage(latestMessage),
	]);

	console.log("first", firstResponse);

	const toolCalls = firstResponse.tool_calls ?? [];

	if (toolCalls.length === 0) {
		// No tool matched — return low confidence for router to escalate
		return {
			tier: MessageTier.TIER1,
			responseText: "",
			agentLog: {
				confidenceScore: 0,
				tokensUsed: firstResponse.usage_metadata?.total_tokens ?? 0,
			},
		};
	}

	// Execute tool calls
	const toolResults: string[] = [];
	for (const toolCall of toolCalls) {
		const tool = tools.find((t) => t.name === toolCall.name);
		if (!tool) continue;
		const result = await tool.invoke(toolCall.args as Record<string, unknown>);
		toolResults.push(`Tool: ${toolCall.name}\nResult: ${result}`);
	}

	const secondResponse = await model.invoke([
		new SystemMessage(`
        You are a customer support agent. Use the tool results to write a short natural reply.
        
				  LANGUAGE & DIALECT:
        - Respond in the EXACT same language and dialect the customer used.
        - Egyptian Arabic → Egyptian Arabic slang.

        TONE:
        - Match the customer's emotional tone. Angry → calm and apologetic first.

        STYLE:
        - Short and natural. Texting style. No bullet points or lists.
        Respond ONLY with valid JSON, no markdown:
        { "agentText": string, "confidenceScore": number }
        
        confidenceScore rules:
        - 0.9+ if the tool returned clear complete data
        - 0.6-0.8 if partial data or minor uncertainty
        - below 0.6 if the result was an error or incomplete
        
        Tool Results:
        ${toolResults.join("\n\n")}
    `),
		new HumanMessage(latestMessage),
	]);

	const raw =
		typeof secondResponse.content === "string"
			? secondResponse.content
			: (secondResponse.content[0] as { text: string }).text;

	const cleaned = raw.replace(/```json|```/g, "").trim();
	const parsed = JSON.parse(cleaned) as {
		agentText: string;
		confidenceScore: number;
	};

	console.log("second", parsed);

	const totalTokens =
		(firstResponse.usage_metadata?.total_tokens ?? 0) +
		(secondResponse.usage_metadata?.total_tokens ?? 0);

	return {
		tier: MessageTier.TIER1,
		responseText: parsed.agentText,
		agentLog: {
			confidenceScore: parsed.confidenceScore,
			tokensUsed: totalTokens,
		},
	};
}
