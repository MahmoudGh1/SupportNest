import { reportQueue } from "src/queues/reportQueue.js";
import * as conversationService from "src/services/conversations.service.js";
import * as ticketService from "src/services/ticket.service.js";
import type { WsSendMessagePayload } from "src/types/ws.types.js";
export async function handleMessageSend(
	ws: any,
	payload: WsSendMessagePayload,
) {
	const { conversationId, organizationId, customerId, apiKeyId } = ws.meta!;

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
