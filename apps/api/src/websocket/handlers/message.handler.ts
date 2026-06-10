import { AgentAction, AgentTier, MessageRole } from "generated/prisma/enums.js";
import prisma from "src/config/prisma.js";
import { askTier0Agent } from "src/services/rag.service.js";
import { loadMemory, appendToMemory } from "../../utils/conversationMemory.utils.js";
import { activeSockets } from "../ws.map.js";

export async function handleMessageSend(ws: any, payload: any) {
	const { content } = payload;
	const { conversationId, organizationId } = ws.meta!;

	const [, memory] = await Promise.all([
		prisma.message.create({
			data: {
				conversationId,
				role: MessageRole.CUSTOMER,
				content,
			},
		}),
		loadMemory(conversationId),
	]);

	ws.send(JSON.stringify({ type: "typing", payload: {} }));

	const aiResponse = await askTier0Agent(content, organizationId, conversationId, memory);

	const aiMessage = await prisma.message.create({
		data: {
			conversationId,
			role: MessageRole.AI,
			content: aiResponse.responseText,
			tier: AgentTier.TIER1,
		},
	});

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

	Promise.all([
		prisma.agentLog.create({
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
		}),
		appendToMemory(conversationId, content, aiResponse.responseText),
	]).catch((err) => console.error("[Handler] Background writes failed:", err));
}
