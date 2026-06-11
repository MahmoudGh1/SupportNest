// import { AgentAction, AgentTier, MessageRole } from "generated/prisma/enums.js";
// import prisma from "src/config/prisma.js";
// import { askTier0Agent } from "src/services/rag.service.js";
// import { loadMemory, appendToMemory } from "../../utils/conversationMemory.utils.js";
// import { activeSockets } from "../ws.map.js";

// export async function handleMessageSend(ws: any, payload: any) {
// 	const { content } = payload;
// 	const { conversationId, organizationId } = ws.meta!;

// 	await prisma.message.create({
// 		data: {
// 			conversationId,
// 			role: MessageRole.CUSTOMER,
// 			content,
// 		},
// 	});

// 	ws.send(JSON.stringify({ type: "typing", payload: {} }));

// 	const memory = await loadMemory(conversationId);

// 	const aiResponse = await askTier0Agent(content, organizationId, conversationId, memory);

// 	const aiMessage = await prisma.message.create({
// 		data: {
// 			conversationId,
// 			role: MessageRole.AI,
// 			content: aiResponse.responseText,
// 			tier: AgentTier.TIER1,
// 		},
// 	});

// 	await prisma.agentLog.create({
// 		data: {
// 			conversationId,
// 			tier: aiResponse.agentLog.tier,
// 			action: aiResponse.action,
// 			input: content,
// 			output: aiResponse.responseText,
// 			confidenceScore: aiResponse.agentLog.confidenceScore,
// 			latencyMs: aiResponse.agentLog.latencyMs,
// 			tokensUsed: aiResponse.agentLog.tokensUsed,
// 		},
// 	});

// 	await appendToMemory(conversationId, content, aiResponse.responseText);

// 	ws.send(
// 		JSON.stringify({
// 			type: "message_ai",
// 			payload: {
// 				message: {
// 					id: aiMessage.id,
// 					role: aiMessage.role,
// 					content: aiMessage.content,
// 					tier: aiMessage.tier,
// 					created_at: aiMessage.createdAt,
// 				},
// 				action: aiResponse.action,
// 			},
// 		}),
// 	);
// }

import { AgentAction, AgentTier, MessageRole } from "generated/prisma/enums.js";
import prisma from "src/config/prisma.js";
import { askTier0Agent } from "src/services/rag.service.js";
import { runTier1Agent } from "src/services/tier1.service.js";
import {
  loadMemory,
  appendToMemory,
} from "../../utils/conversationMemory.utils.js";
import { activeSockets } from "../ws.map.js";
import type { AuthenticatedSocket } from "src/types/ws.types.js";

function send(socket: AuthenticatedSocket, envelope: object) {
  socket.send(JSON.stringify(envelope));
}

export async function handleMessageSend(ws: AuthenticatedSocket, payload: any) {
  const { content } = payload;
  const { conversationId, organizationId, customerId } = ws.meta!;

  // 1. Persist the customer message
  await prisma.message.create({
    data: {
      conversationId,
      role: MessageRole.CUSTOMER,
      content,
    },
  });

  send(ws, { type: "typing", payload: {} });

  // 2. Load Redis memory for context
  const memory = await loadMemory(conversationId);

  // ── TIER 0 ────────────────────────────────────────────────────────────────
  const tier0Response = await askTier0Agent(
    content,
    organizationId,
    conversationId,
    memory,
  );

  const tier0Confident =
    tier0Response.agentLog.confidenceScore >= 0.6 &&
    tier0Response.action !== AgentAction.NO_MATCH;

  if (tier0Confident) {
    // Tier 0 resolved it — save + respond
    const aiMessage = await prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.AI,
        content: tier0Response.responseText,
        tier: AgentTier.TIER1, // schema uses TIER1 for Tier 0 responses
      },
    });

    await prisma.agentLog.create({
      data: {
        conversationId,
        tier: tier0Response.agentLog.tier,
        action: tier0Response.action,
        input: content,
        output: tier0Response.responseText,
        confidenceScore: tier0Response.agentLog.confidenceScore,
        latencyMs: tier0Response.agentLog.latencyMs,
        tokensUsed: tier0Response.agentLog.tokensUsed,
      },
    });

    await appendToMemory(conversationId, content, tier0Response.responseText);

    send(ws, {
      type: "message_ai",
      payload: {
        message: {
          id: aiMessage.id,
          role: aiMessage.role,
          content: aiMessage.content,
          tier: aiMessage.tier,
          created_at: aiMessage.createdAt,
        },
        action: tier0Response.action,
      },
    });

    return;
  }

  // ── TIER 1 ────────────────────────────────────────────────────────────────
  // Tier 0 couldn't answer confidently → escalate to Tier 1 (API tool-calling)
  console.log("[Pipeline] Tier 0 low confidence — escalating to Tier 1");

  await prisma.agentLog.create({
    data: {
      conversationId,
      tier: tier0Response.agentLog.tier,
      action: AgentAction.ESCALATED_TO_TIER2, // escalated from tier0 → tier1
      input: content,
      output: tier0Response.responseText,
      confidenceScore: tier0Response.agentLog.confidenceScore,
      latencyMs: tier0Response.agentLog.latencyMs,
      tokensUsed: tier0Response.agentLog.tokensUsed,
    },
  });

  const tier1Response = await runTier1Agent(
    content,
    organizationId,
    conversationId,
    customerId,
    memory,
  );

  // NEEDS_AUTH — customer is anonymous, send them the login link
  if (tier1Response.action === "NEEDS_AUTH") {
    send(ws, {
      type: "needs_auth",
      payload: {
        message: tier1Response.responseText,
        loginUrl: tier1Response.loginUrl,
      },
    });
    return;
  }

  // Tier 1 resolved it
  if (tier1Response.action === AgentAction.RESOLVED) {
    const aiMessage = await prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.AI,
        content: tier1Response.responseText,
        tier: AgentTier.TIER1,
      },
    });

    await prisma.agentLog.create({
      data: {
        conversationId,
        tier: tier1Response.agentLog.tier,
        action: tier1Response.action,
        input: content,
        output: tier1Response.responseText,
        confidenceScore: tier1Response.agentLog.confidenceScore,
        latencyMs: tier1Response.agentLog.latencyMs,
        tokensUsed: tier1Response.agentLog.tokensUsed,
      },
    });

    // appendToMemory already called inside runTier1Agent on resolve
    send(ws, {
      type: "message_ai",
      payload: {
        message: {
          id: aiMessage.id,
          role: aiMessage.role,
          content: aiMessage.content,
          tier: aiMessage.tier,
          created_at: aiMessage.createdAt,
        },
        action: tier1Response.action,
        toolsUsed: tier1Response.toolsUsed,
      },
    });

    return;
  }

  // Tier 1 also failed → escalate to human (Tier 2 comes later)
  console.log("[Pipeline] Tier 1 failed — escalating to human");

  await prisma.agentLog.create({
    data: {
      conversationId,
      tier: tier1Response.agentLog.tier,
      action: AgentAction.ESCALATED_TO_HUMAN,
      input: content,
      output: tier1Response.responseText,
      confidenceScore: tier1Response.agentLog.confidenceScore,
      latencyMs: tier1Response.agentLog.latencyMs,
      tokensUsed: tier1Response.agentLog.tokensUsed,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { conversationStatus: "ESCALATED" },
  });

  await prisma.ticket.create({
    data: {
      conversationId,
      organizationId,
      status: "OPEN",
      priority: "MEDIUM",
      customerMessage: content,
      tiersVisited: [AgentTier.TIER1, AgentTier.TIER2],
      agentAttempts: 2,
    },
  });

  send(ws, {
    type: "escalated_to_human",
    payload: {
      message:
        "I'm connecting you with a human agent who can help. They'll have full context of our conversation.",
    },
  });
}
