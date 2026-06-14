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
