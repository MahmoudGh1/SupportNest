import {
	AgentAction,
	AgentTier,
	MessageRole,
} from "generated/prisma/enums.js";
import prisma from "src/config/prisma.js";
import { askTier0Agent } from "src/services/rag.service.js";
import {
	loadMemory,
	appendToMemory,
} from "../../utils/conversationMemory.utils.js";
import { activeSockets } from "../ws.map.js";
import type {
	ConversationMessage,
	PipelineContext,
} from "src/types/agent.types.js";
import { runRouter } from "src/agents/router.agent.js";

export async function handleMessageSend(
	ws: WebSocket,
	payload: { conversationId: string; content: string },
) {
	const { content } = payload;
	const { conversationId, organizationId } = ws.meta!;

	await prisma.message.create({
		data: {
			conversationId,
			role: MessageRole.CUSTOMER,
			content,
		},
	});

	ws.send(JSON.stringify({ type: "typing", conversationId }));

	// load conversation context
	// fetch org id from conversation (needed for PipelineContext)
	const conversation = await prisma.conversation.findUnique({
		where: { id: conversationId },
		select: { organizationId: true },
	});

	if (!conversation) {
		ws.send(
			JSON.stringify({
				type: "error",
				conversationId,
				message: "Conversation not found.",
			}),
		);
		return;
	}

	// load history from Redis
	const redisHistory = await loadMemory(conversationId);

	// Build PipelineContext for the router
	console.log(organizationId);
	const context: PipelineContext = {
		conversationId,
		organizationId,
		latestMessage: content,
		conversationHistory: redisHistory as ConversationMessage[],
	};

	// run the router
	const routerOutput = await runRouter(context);

	// save AI message to DB
	const aiMessage = await prisma.message.create({
		data: {
			conversationId,
			role: routerOutput.resolvedByTier === "HUMAN" ? "HUMAN_AGENT" : "AI",
			content: routerOutput.finalResponse,
			tier:
				routerOutput.resolvedByTier === "HUMAN"
					? null
					: routerOutput.resolvedByTier,
		},
	});

	// If human escalation - create a ticket
	if (routerOutput.resolvedByTier === "HUMAN") {
		await prisma.ticket.create({
			data: {
				conversationId,
				organizationId: conversation.organizationId,
				status: "OPEN",
				priority: "MEDIUM",
			},
		});

		await prisma.conversation.update({
			where: { id: conversationId },
			data: { conversationStatus: "ESCALATED" },
		});
	}

	// append both messages to redis history
	await appendToMemory(conversationId, content, routerOutput.finalResponse);

	ws.send(
		JSON.stringify({
			type: "message_ai",
			payload: {
				message: {
					conversationId,
					role: "AI",
					content: routerOutput.finalResponse,
					tier:
						routerOutput.resolvedByTier === "HUMAN"
							? null
							: routerOutput.resolvedByTier,
					created_at: aiMessage.createdAt,
				},
			},
		}),
	);
}
