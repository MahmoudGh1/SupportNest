import prisma from "src/config/prisma.js";
import AppError from "src/utils/appError.js";
import asyncHandler from "src/utils/asyncHandler.js";
import type { Response, RequestHandler } from "express";
import type { AuthenticatedWidgetRequest } from "src/types/apiKey.types.js";
import { extractTokenFromHeader, verifyToken } from "../utils/jwt.util.js";
import {
	AgentAction,
	AgentTier,
	ConversationStatus,
	MessageRole,
} from "generated/prisma/enums.js";
import { MessageTier, type Message } from "generated/prisma/client.js";
import { askTier0Agent } from "src/services/rag.service.js";
import * as conversationService from "src/services/conversations.service.js";
import { runRouter } from "src/agents/router.agent.js";
import type { PipelineContext } from "src/types/agent.types.js";

export const startConversation: RequestHandler = asyncHandler(
	async (req: AuthenticatedWidgetRequest, res: Response) => {
		const organization = req.organization;
		const apiKey = req.apiKey;

		const token = extractTokenFromHeader(req.headers);

		let customer = null;
		try {
			customer = await conversationService.upsertCustomer({
				organization: {
					id: organization?.id as string,
					widgetSecret: organization?.widgetSecret as string,
				},
				customerToken: token,
			});
		} catch (error: any) {
			throw new AppError("couldn't create or update customer", error);
		}

		let conversation = null;

		try {
			conversation = await conversationService.startConversation({
				organizationId: organization?.id as string,
				customerId: customer.id,
				apiKeyId: apiKey?.id as string,
			});
		} catch (error: any) {
			throw new AppError(
				"couldn't start a new conversation or resume an existing one",
				error,
			);
		}

		return res.status(201).json({
			success: true,
			message: "Conversation created successfully",
			data: {
				conversationId: conversation.id,
				customerId: customer.id,
			},
		});
	},
);

/****************************/
type PipelineResult = {
	responseText: string;
	action: AgentAction;
	tier: MessageTier; // which tier produced the response
	agentLog: {
		tier: AgentTier;
		confidenceScore: number;
		latencyMs: number;
		tokensUsed: number;
	};
};

const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

const fakeAIService = async (
	conversationId: string,
	organizationId: string,
	messageContent: string,
	conversationHistory: Message[],
): Promise<PipelineResult> => {
	await sleep(2000);

	return {
		responseText: `AI response for "${messageContent}"`,
		action: AgentAction.RESOLVED,
		tier: MessageTier.TIER1,
		agentLog: {
			tier: AgentTier.TIER1,
			confidenceScore: 0.91,
			latencyMs: 2000,
			tokensUsed: 150,
		},
	};
};

export const getMessages: RequestHandler = asyncHandler(
	async (req: AuthenticatedWidgetRequest, res: Response) => {
		const { id: conversationId } = req.params;
		const apiKeyRecord = req.apiKey;

		const conversation = await prisma.conversation.findUnique({
			where: { id: conversationId as string },
			select: { id: true, organizationId: true },
		});

		if (!conversation) {
			throw new AppError("conversation not found", 404);
		}

		const messages = await prisma.message.findMany({
			where: { conversationId: conversationId as string },
			orderBy: { createdAt: "asc" },
			select: {
				id: true,
				role: true,
				content: true,
				tier: true,
				createdAt: true,
			},
		});

		return res.status(200).json({ messages });
	},
);

/******************************/
/*
export const sendMessage: RequestHandler = asyncHandler(
	async (req: AuthenticatedWidgetRequest, res: Response) => {
		const apiKeyRecord = req.apiKey;

		const conversation = await prisma.conversation.findUnique({
			where: {
				id: req.params.id as string,
			},
		});
		if (!conversation) {
			throw new AppError("conversation not found", 400);
		}

		if (!apiKeyRecord || conversation.apiKeyId !== apiKeyRecord.id) {
			throw new AppError(
				"conversation doesn't belong to the current organization",
			);
		}

		if (conversation.conversationStatus === ConversationStatus.CLOSED) {
			throw new AppError("conversation is already closed");
		}

		const customerMessage = await prisma.message.create({
			data: {
				conversationId: conversation.id,
				role: MessageRole.CUSTOMER,
				content: req.body.content,
			},
		});

		const conversationHistory = await prisma.message.findMany({
			where: {
				conversationId: conversation.id,
			},
		});

		const aiResponse = await askTier0Agent(
			customerMessage.content,
			conversation.organizationId,
			conversation.id,
			conversationHistory,
		);
		const aiMessage = await prisma.message.create({
			data: {
				conversationId: conversation.id,
				role: MessageRole.AI,
				content: aiResponse.responseText,
				tier: AgentTier.TIER1,
			},
		});

		await prisma.agentLog.create({
			data: {
				conversationId: conversation.id,
				tier: aiResponse.agentLog.tier,
				action: aiResponse.action,
				input: customerMessage.content,
				output: aiResponse.responseText,
				confidenceScore: aiResponse.agentLog.confidenceScore,
				latencyMs: aiResponse.agentLog.latencyMs,
				tokensUsed: aiResponse.agentLog.tokensUsed,
			},
		});
 /*
		/* If action is escalated_to_human: 
export const sendMessage: RequestHandler = asyncHandler(
	async (req: AuthenticatedWidgetRequest, res: Response) => {
		// const apiKeyRecord = req.apiKey;
		// if (!apiKeyRecord || !apiKeyRecord.id) {
		// 	throw new AppError("invalid api key");
		// }
		// const context = await conversationService.sendMessage({ conversationId: req.params.id, organizationId: apiKeyRecord.organizationId, latestMessage: req.body.content, apiKeyId: apiKeyRecord.id });
		// const aiResponse = await runRouter(context);
		// console.log(aiResponse);
		// const aiMessage = await prisma.message.create({
		// 	data: {
		// 		conversationId: conversation.id,
		// 		role: MessageRole.AI,
		// 		content: aiResponse.responseText,
		// 		tier: AgentTier.TIER1,
		// 	},
		// });
		// await prisma.agentLog.create({
		// 	data: {
		// 		conversationId: conversation.id,
		// 		tier: aiResponse.agentLog.tier,
		// 		action: aiResponse.action,
		// 		input: customerMessage.content,
		// 		output: aiResponse.responseText,
		// 		confidenceScore: aiResponse.agentLog.confidenceScore,
		// 		latencyMs: aiResponse.agentLog.latencyMs,
		// 		tokensUsed: aiResponse.agentLog.tokensUsed,
		// 	},
		// });
		/* If action is escalated_to_human: 
      create a tickets row
      update conversation_status to escalated */
// res.status(201).json({
// 	message: {
// 		id: aiMessage.id,
// 		role: aiMessage.role,
// 		content: aiMessage.content,
// 		tier: aiMessage.tier,
// 		created_at: aiMessage.createdAt,
// 	},
// 	action: aiResponse.action,
// });
