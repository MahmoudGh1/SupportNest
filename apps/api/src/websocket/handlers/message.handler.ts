import { AgentTier, MessageRole } from "generated/prisma/enums.js";
import prisma from "src/config/prisma.js";
import { askTier0Agent } from "src/services/rag.service.js";

export async function handleMessageSend(ws: any, envelope: any) {
	const { content } = envelope.payload;
	const { conversationId, organizationId } = ws.meta!;

	// 1 - Persist customer message
	await prisma.message.create({
		data: {
			conversationId,
			role: MessageRole.CUSTOMER,
			content,
		},
	});

	// 2 - Tell the client AI is thinking
	ws.send(JSON.stringify({ type: "typing", payload: {} }));

	// 3 - Run AI pipeline - returns
	/*{
          responseText: parsed.agentText,
          action: AgentAction.NO_MATCH,
          tier: MessageTier.TIER1,
          agentLog: {
            tier: AgentTier.TIER1,
            confidenceScore: parsed.confidenceScore,
            latencyMs: 1500,
            tokensUsed: usage?.total_tokens ?? 0,
  },*/

	const aiResponse = await askTier0Agent(
		content,
		organizationId,
		conversationId,
	);

	// 4. Persist AI response

	const aiMessage = await prisma.message.create({
		data: {
			conversationId: conversationId,
			role: MessageRole.AI,
			content: aiResponse.responseText,
			tier: AgentTier.TIER1,
		},
	});

	// 5. Persist agent log

	await prisma.agentLog.create({
		data: {
			conversationId,
			tier: aiResponse.agentLog.tier,
			action: aiResponse.action,
			input: content,
			output: aiResponse.responseText,
			confidenceScore: aiResponse.agentLog.confidenceScore,
			latencyMs: aiResponse.agentLog.latencyMs,
			tokensUsed: aiResponse.agentLog.tokensUsed,
		},
	});

	// 6. Handle escalation path

	// 7. Send AI reply
	ws.send(
		JSON.stringify({
			type: "message_ai",
			payload: {
				message: {
					id: aiMessage.id,
					role: aiMessage.role,
					content: aiMessage.content,
					tier: aiMessage.tier,
					created_at: aiMessage.createdAt,
				},
				action: aiResponse.action,
			},
		}),
	);
}
