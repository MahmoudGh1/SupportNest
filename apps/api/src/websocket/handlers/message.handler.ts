import { ConversationStatus } from "generated/prisma/enums.js";
import prisma from "src/config/prisma.js";
import { reportQueue } from "src/queues/reportQueue.js";
import * as conversationService from "src/services/conversations.service.js";
import * as ticketService from "src/services/ticket.service.js";
import type { WsSendMessagePayload } from "src/types/ws.types.js";
import { activeSockets } from "src/websocket/ws.map.js";
import { send } from "src/ws/websocket.js";

export async function handleMessageSend(
	ws: any,
	payload: WsSendMessagePayload,
) {
	const { conversationId, organizationId, customerId, apiKeyId } = ws.meta!;

	/* for every message check -->
		- if current conversation has been closed? 
			create a new one,
			update activeSockets map,
			update ws.meta,
			send the new conversation to the client with event type "conversation_started"
	*/
	const existing = await prisma.conversation.findUnique({
		where: { id: ws.meta!.conversationId },
		select: { conversationStatus: true },
	});

	if (existing?.conversationStatus !== ConversationStatus.ACTIVE) {
		// stale — either closed by inactivity, or (edge case) doesn't exist at all.
		const newConversation = await conversationService.startConversation({
			organizationId,
			customerId,
			apiKeyId,
		});

		activeSockets.delete(ws.meta!.conversationId);
		ws.meta!.conversationId = newConversation.id;
		activeSockets.set(newConversation.id, ws);

		send(ws, {
			type: "conversation_started",
			payload: { conversationId: newConversation.id },
		});
	}
	console.log("handleMessageSend running");
	const { routerOutput, aiMessage } =
		await conversationService.processPipelineTurn({
			conversationId,
			organizationId,
			customerId,
			content: payload.content,
		});

	ws.send(JSON.stringify({ type: "typing", conversationId }));

	// If human escalation - create a ticket
	if (routerOutput.resolvedByTier === "HUMAN") {
		// + enqueue reporter job here
		await reportQueue.add("generate-report", {
			conversationId,
			organizationId,
		});
		await ticketService.createTicket(organizationId, conversationId);
	}

	const messagePayload: any = {
		role: "AI",
		content: routerOutput.finalResponse,
	};

	if (routerOutput.loginUrl) {
		messagePayload.loginUrl = routerOutput.loginUrl;
		messagePayload.type = "auth_required"; // widget can render a login button
	}

	ws.send(
		JSON.stringify({
			type: "message_ai",
			payload: {
				message: {
					conversationId,
					...messagePayload,
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
