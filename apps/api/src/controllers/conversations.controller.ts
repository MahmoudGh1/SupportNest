import prisma from "src/config/prisma.js";
import AppError from "src/utils/appError.js";
import asyncHandler from "src/utils/asyncHandler.js";
import type { Response, RequestHandler } from "express";
import type { AuthenticatedWidgetRequest } from "src/types/apiKey.types.js";
import { extractTokenFromHeader, verifyToken } from "../utils/jwt.util.js";
import { AgentAction, AgentTier, ConversationStatus, MessageRole } from "generated/prisma/enums.js";
import { MessageTier, type Message } from "generated/prisma/client.js";
import { askTier0Agent } from "src/services/rag.service.js";

export const startConversation: RequestHandler = asyncHandler(async (req: AuthenticatedWidgetRequest, res: Response) => {
	const apiKeyRecord = req.apiKey;
	const organization = await prisma.organization.findUnique({
		where: { id: apiKeyRecord?.organizationId as string },
	});

	if (!organization) {
		throw new AppError("your apiKey doesn't belong to any organization");
	}

	let customer = null;
	const token = extractTokenFromHeader(req.headers);

	if (token) {
		const { sub, email = "", name = "", ...claims } = verifyToken(token, organization.widgetSecret);

		customer = await prisma.customer.upsert({
			where: {
				organizationId_externalId: {
					organizationId: organization.id,
					externalId: sub,
				},
			},
			update: {
				name: name as string,
				email: email as string,
				isAnonymous: false,
				metadata: {
					// This automatically performs: existing_metadata || claims
					// It overwrites matching keys and adds new ones
					set: claims,
				},
			},
			create: {
				organizationId: organization.id,
				externalId: sub,
				name: name as string,
				email: email as string,
				isAnonymous: false,
				metadata: claims,
			},
		});
	} else {
		customer = await prisma.customer.create({
			data: {
				organizationId: organization.id,
				externalId: null,
				name: null,
				email: null,
			},
		});
	}

	const conversation = await prisma.conversation.create({
		data: {
			organizationId: organization.id,
			customerId: customer.id,
			apiKeyId: apiKeyRecord?.id as string,
			conversationStatus: "ACTIVE",
			closedAt: null,
		},
	});

	return res.status(201).json({
		success: true,
		message: "Conversation created successfully",
		data: {
			conversationId: conversation.id,
			status: conversation.conversationStatus,
		},
	});
});

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fakeAIService = async (conversationId: string, organizationId: string, messageContent: string, conversationHistory: Message[]): Promise<PipelineResult> => {
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
/******************************/
export const sendMessage: RequestHandler = asyncHandler(async (req: AuthenticatedWidgetRequest, res: Response) => {
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
		throw new AppError("conversation doesn't belong to the current organization");
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

	const aiResponse = await askTier0Agent(customerMessage.content, conversation.organizationId, conversation.id, conversationHistory);
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

	/* If action is escalated_to_human: 
      create a tickets row
      update conversation_status to escalated */

	res.status(201).json({
		message: {
			id: aiMessage.id,
			role: aiMessage.role,
			content: aiMessage.content,
			tier: aiMessage.tier,
			created_at: aiMessage.createdAt,
		},
		action: aiResponse.action,
	});
});

export const getMessages: RequestHandler = asyncHandler(async (req: AuthenticatedWidgetRequest, res: Response) => {
	const { id: conversationId } = req.params;
	const apiKeyRecord = req.apiKey;

	const conversation = await prisma.conversation.findUnique({
		where: { id: conversationId as string },
		select: { id: true, organizationId: true },
	});

	if (!conversation || conversation.organizationId !== apiKeyRecord?.organizationId) {
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
});
