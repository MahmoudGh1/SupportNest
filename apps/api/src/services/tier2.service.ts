import prisma from "src/config/prisma.js";
import { model } from "../config/langChain.js";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { AgentAction, AgentTier, MessageTier } from "generated/prisma/enums.js";
import type { MemoryMessage } from "../utils/conversationMemory.utils.js";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Tier2Input {
  question:       string;
  organizationId: string;
  conversationId: string;
  history:        MemoryMessage[];
}

interface Tier2Response {
  responseText:  string;
  action:        AgentAction;
  tier:          MessageTier;
  ticketCreated: boolean;
  ticketId?:     string;
  agentLog: {
    tier:            AgentTier;
    confidenceScore: number;
    latencyMs:       number;
    tokensUsed:      number;
  };
}

// ─── CONFIDENCE THRESHOLD ─────────────────────────────────────────────────────
// If Tier 2 model confidence is below this → escalate to human (create ticket)
const ESCALATION_THRESHOLD = 0.45;

// ─── TIER 2 SERVICE ───────────────────────────────────────────────────────────
export async function askTier2Agent(input: Tier2Input): Promise<Tier2Response> {
  const start = Date.now();
  const { question, organizationId, conversationId, history } = input;

  // 1. Build conversation history for context
  const historyMessages = history.flatMap((msg): BaseMessage[] => {
    if (msg.role === "customer") return [new HumanMessage(msg.content)];
    if (msg.role === "ai")       return [new AIMessage(msg.content)];
    return [];
  });

  // 2. Ask the model — Tier 2 gets the full conversation history
  //    and tries harder than Tier 1 to solve the issue
  let parsed: { agentText: string; confidenceScore: number; canResolve: boolean };

  try {
    const response = await model.invoke([
      new SystemMessage(`
        You are a senior customer support specialist handling escalated issues.
        Tier 1 could not resolve this customer's issue. You must try harder.

        LANGUAGE & DIALECT:
        - Detect the language and dialect the user writes in and respond in the EXACT same language and dialect.
        - Egyptian Arabic → Egyptian Arabic slang.

        TONE:
        - Empathetic and professional. Acknowledge the frustration.
        - Short and direct — no long essays.

        YOUR JOB:
        - Review the full conversation history carefully.
        - Try to provide a more detailed, specific solution.
        - If you CAN resolve it: set canResolve to true and give the answer.
        - If you CANNOT resolve it: set canResolve to false. This will escalate to a human agent.

        Return JSON only, no markdown:
        {
          "agentText": string,
          "confidenceScore": number between 0 and 1,
          "canResolve": boolean
        }
      `),
      ...historyMessages,
      new HumanMessage(question),
    ]);

    const raw = typeof response.content === "string"
      ? response.content
      : (response.content[0] as { text: string }).text;

    const cleaned = raw.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);

    const usage = response.usage_metadata as { total_tokens?: number } | undefined;
    const latencyMs = Date.now() - start;
    const tokensUsed = usage?.total_tokens ?? 0;

    // 3. Decide: resolve or escalate to human
    const shouldEscalate = !parsed.canResolve || parsed.confidenceScore < ESCALATION_THRESHOLD;

    if (!shouldEscalate) {
      // ── Tier 2 resolved it ────────────────────────────────────────────────
      await logAgentAction({
        conversationId,
        tier:            AgentTier.TIER2,
        action:          AgentAction.RESOLVED,
        input:           question,
        output:          parsed.agentText,
        confidenceScore: parsed.confidenceScore,
        latencyMs,
        tokensUsed,
      });

      return {
        responseText:  parsed.agentText,
        action:        AgentAction.RESOLVED,
        tier:          MessageTier.TIER2,
        ticketCreated: false,
        agentLog: {
          tier:            AgentTier.TIER2,
          confidenceScore: parsed.confidenceScore,
          latencyMs,
          tokensUsed,
        },
      };
    }

    // 4. Tier 2 cannot resolve → create ticket and escalate to human
    const ticket = await createEscalationTicket(conversationId, organizationId);

    // 5. Log the escalation
    await logAgentAction({
      conversationId,
      tier:            AgentTier.TIER2,
      action:          AgentAction.ESCALATED_TO_HUMAN,
      input:           question,
      output:          parsed.agentText,
      confidenceScore: parsed.confidenceScore,
      latencyMs,
      tokensUsed,
    });

    // 6. Build a natural escalation message in the customer's language
    const escalationText = await buildEscalationMessage(question, history);

    return {
      responseText:  escalationText,
      action:        AgentAction.ESCALATED_TO_HUMAN,
      tier:          MessageTier.TIER2,
      ticketCreated: true,
      ticketId:      ticket.id,
      agentLog: {
        tier:            AgentTier.TIER2,
        confidenceScore: parsed.confidenceScore,
        latencyMs,
        tokensUsed,
      },
    };

  } catch (err) {
    console.error("[Tier2] Model error:", err);

    // Fallback — if the model itself crashes, still create a ticket
    const ticket = await createEscalationTicket(conversationId, organizationId);

    await logAgentAction({
      conversationId,
      tier:            AgentTier.TIER2,
      action:          AgentAction.ESCALATED_TO_HUMAN,
      input:           question,
      output:          "Model error — auto escalated",
      confidenceScore: 0,
      latencyMs:       Date.now() - start,
      tokensUsed:      0,
    });

    return {
      responseText:  buildFallbackEscalationMessage(),
      action:        AgentAction.ESCALATED_TO_HUMAN,
      tier:          MessageTier.TIER2,
      ticketCreated: true,
      ticketId:      ticket.id,
      agentLog: {
        tier:            AgentTier.TIER2,
        confidenceScore: 0,
        latencyMs:       Date.now() - start,
        tokensUsed:      0,
      },
    };
  }
}

// ─── CREATE TICKET ────────────────────────────────────────────────────────────
async function createEscalationTicket(conversationId: string, organizationId: string) {
  // Check if ticket already exists for this conversation — avoid duplicates
  const existing = await prisma.ticket.findUnique({
    where: { conversationId },
  });

  if (existing) return existing;

  // Create ticket + flip conversation status to ESCALATED atomically
  const [ticket] = await prisma.$transaction([
    prisma.ticket.create({
      data: {
        conversationId,
        organizationId,
        status:   "OPEN",
        priority: "MEDIUM",
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data:  { conversationStatus: "ESCALATED" },
    }),
  ]);

  return ticket;
}

// ─── LOG AGENT ACTION ─────────────────────────────────────────────────────────
async function logAgentAction(data: {
  conversationId:  string;
  tier:            AgentTier;
  action:          AgentAction;
  input:           string;
  output:          string;
  confidenceScore: number;
  latencyMs:       number;
  tokensUsed:      number;
}) {
  try {
    await prisma.agentLog.create({ data });
  } catch (err) {
    // Non-critical — don't crash the response if logging fails
    console.error("[Tier2] Failed to log agent action:", err);
  }
}

// ─── ESCALATION MESSAGE ───────────────────────────────────────────────────────
// Ask the model to write a natural escalation message in the customer's language
async function buildEscalationMessage(
  question: string,
  history:  MemoryMessage[],
): Promise<string> {
  try {
    const response = await model.invoke([
      new SystemMessage(`
        You are a customer support agent.
        The customer's issue could not be resolved automatically.
        A human support agent will now take over.

        Write a SHORT, natural message (1-2 sentences max) telling the customer:
        - Their issue has been noted
        - A human agent will follow up with them

        Detect the customer's language from the conversation and respond in the SAME language and dialect.
        Egyptian Arabic → Egyptian Arabic slang.
        Do NOT say "ticket created" or use technical terms.
        Sound human and empathetic.

        Return only the message text — no JSON, no markdown.
      `),
      new HumanMessage(
        `Last customer message: "${question}"\nHistory length: ${history.length} messages`,
      ),
    ]);

    const text = typeof response.content === "string"
      ? response.content
      : (response.content[0] as { text: string }).text;

    return text.trim();
  } catch {
    return buildFallbackEscalationMessage();
  }
}

function buildFallbackEscalationMessage(): string {
  return "تم تسجيل مشكلتك وهيتواصل معاك أحد أخصائيي الدعم في أقرب وقت.";
}