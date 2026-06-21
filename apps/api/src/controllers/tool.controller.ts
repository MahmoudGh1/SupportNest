import prisma from "src/config/prisma.js";
import { model } from "../config/langChain.js";
import { HumanMessage, SystemMessage, AIMessage, ToolMessage, BaseMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { AgentTier, MessageTier, ApiAuthType, HttpMethod } from "generated/prisma/enums.js";
import type { ToolDefinition, BusinessApiConfig } from "generated/prisma/client.js";
import { escalateToHuman } from "./humanEscalation.service.js";
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

// ─── Auth header builder (same as Tier1) ──────────────────────────────────────

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

// ─── Build one LangChain tool from a ToolDefinition row (same as Tier1) ──────

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

        const url = new URL(`${apiConfig.baseUrl}${resolvedPath}`);
        for (const [k, v] of Object.entries(queryParams)) url.searchParams.set(k, v);

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...buildAuthHeaders(apiConfig),
        };

        const fetchOptions: RequestInit = { method: toolDef.method, headers };
        if (toolDef.method !== HttpMethod.GET && toolDef.method !== HttpMethod.DELETE && Object.keys(bodyParams).length > 0) {
          fetchOptions.body = JSON.stringify(bodyParams);
        }

        const response = await fetch(url.toString(), fetchOptions);
        const data = (await response.json()) as { message?: string } | null;

        if (!response.ok) {
          return JSON.stringify({ error: true, status: response.status, message: data?.message ?? "Request failed" });
        }

        return JSON.stringify(data);
      } catch (err) {
        console.error(`[Tier2 Tool Error] ${toolDef.name}:`, err);
        return JSON.stringify({ error: true, message: err instanceof Error ? err.message : "Tool execution failed" });
      }
    },
  });
}

// ─── STRUCTURED FINAL OUTPUT SCHEMA ───────────────────────────────────────────
// The model must explicitly say whether it resolved the issue or not —
// "no tool call" alone is ambiguous between "I have the answer" and "I gave up."

const finalAnswerSchema = z.object({
  agentText: z.string().describe("The reply to send to the customer, or empty string if escalating."),
  resolved: z.boolean().describe("true if the customer's question was actually answered using real tool data. false if nothing matching was found or the request cannot be fulfilled with available tools."),
  confidenceScore: z.number(),
});

export async function askTier2Agent(context: PipelineContext): Promise<TierResponse> {
  const { organizationId, latestMessage, conversationHistory, conversationId } = context;

  // 1. Load org's API config + ALL active tools (public + private)
  const apiConfig = await prisma.businessApiConfig.findUnique({
    where: { organizationId },
    include: { toolDefinitions: { where: { isActive: true } } },
  });

  // No tools available at all — can't tool-chain, hand straight to human
  if (!apiConfig || apiConfig.toolDefinitions.length === 0) {
    const { responseText, ticketId } = await escalateToHuman(
      conversationId,
      organizationId,
      latestMessage,
      conversationHistory,
    );
    return {
      tier: MessageTier.TIER2,
      responseText,
      ticketId,
      agentLog: { confidenceScore: 0, tokensUsed: 0 },
    };
  }

  const tools = apiConfig.toolDefinitions.map((t) => buildTool(t, apiConfig));
  const toolMap = new Map(tools.map((t) => [t.name, t]));
  const modelWithTools = model.bindTools(tools);

  const toolDescriptions = apiConfig.toolDefinitions.map((t) => `- ${t.name}: ${t.description}`).join("\n");

  const historyMessages = conversationHistory.flatMap((msg): BaseMessage[] => {
    if (msg.role === "CUSTOMER") return [new HumanMessage(msg.content)];
    if (msg.role === "AI") return [new AIMessage(msg.content)];
    return [];
  });

  const systemPrompt = new SystemMessage(`
You are a customer support agent handling a complex request that may require multiple steps to fully resolve.

AVAILABLE TOOLS:
${toolDescriptions}

HOW TO WORK:
- Some questions require chaining multiple tool calls. For example: to find a specific item by name when no "search by name" tool exists, first call a tool that lists/filters items (e.g. by status or category), find the matching item in that result, then call a detail/lookup tool using that item's ID.
- Look carefully at each tool result before deciding your next step. Use real IDs and values from previous tool results — never invent them.
- Only call a tool when it's genuinely needed to answer the question. Don't call tools for greetings or unrelated chat.
- You may call multiple tools across multiple turns to fully resolve the request, but only as many as actually needed.
- Never fabricate data that didn't come from a tool result.

TONE:
- Angry/frustrated → calm, apologetic, reassuring. Acknowledge the feeling first.
- Confused → patient and simple.

STYLE:
- Short and natural, texting style. No bullet points or lists.

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

    if (toolCalls.length === 0) {
      // Model stopped calling tools — it believes it's ready to answer.
      // Push its message and break out to the final structured-answer pass.
      messages.push(response);
      break;
    }

    messages.push(response);
    toolCallCount += toolCalls.length;

    const toolResults = await Promise.all(
      toolCalls.map(async (toolCall) => {
        const tool = toolMap.get(toolCall.name);
        const result = tool
          ? await tool.invoke(toolCall.args as Record<string, unknown>).catch((err: Error) =>
              JSON.stringify({ error: true, message: err.message }),
            )
          : JSON.stringify({ error: true, message: `Tool ${toolCall.name} not found` });

        return new ToolMessage({
          content: result,
          tool_call_id: toolCall.id ?? "",
        });
      }),
    );

    messages.push(...toolResults);
  }

  // ─── FINAL STRUCTURED ANSWER ─────────────────────────────────────────────────
  // Force a structured decision: did the tool chain actually resolve the question?
  const jsonModel = model.withStructuredOutput(finalAnswerSchema, { name: "tier2_response" });

  const finalResponse = await jsonModel.invoke([
    ...messages,
    new SystemMessage(`
Based on everything above, decide:
- If you found real data that answers the customer's question: set resolved=true and write agentText.
- If after using the available tools nothing matches what the customer asked for, or the request can't be fulfilled with available tools: set resolved=false and leave agentText empty.
- If you stopped because you hit the maximum number of tool calls without finding an answer: set resolved=false.
Never fabricate an answer just to mark resolved=true.
    `),
  ]);

  totalTokens += finalResponse.usage_metadata?.total_tokens ?? 0;

  // ─── NOT RESOLVED → escalate to human, ticket gets created ───────────────────
  if (!finalResponse.resolved) {
    const { responseText, ticketId } = await escalateToHuman(
      conversationId,
      organizationId,
      latestMessage,
      conversationHistory,
    );

    return {
      tier: MessageTier.TIER2,
      responseText,
      ticketId,
      agentLog: { confidenceScore: finalResponse.confidenceScore, tokensUsed: totalTokens },
    };
  }

  // ─── RESOLVED ─────────────────────────────────────────────────────────────────
  await appendToMemory(conversationId, latestMessage, finalResponse.agentText);

  return {
    tier: MessageTier.TIER2,
    responseText: finalResponse.agentText,
    agentLog: { confidenceScore: finalResponse.confidenceScore, tokensUsed: totalTokens },
  };
}