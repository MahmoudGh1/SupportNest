import prisma from "src/config/prisma.js";
import AppError from "src/utils/appError.js";
import asyncHandler from "src/utils/asyncHandler.js";
import type { Request, Response, RequestHandler } from "express";
import type { AuthenticatedWidgetRequest } from "src/types/apiKey.types.js";
import * as conversationService from "src/services/conversations.service.js";

export const startConversation: RequestHandler = asyncHandler(
	async (req: Request, res: Response) => {
		const authReq = req as AuthenticatedWidgetRequest;

		const organization = authReq.organization;
		const apiKey = authReq.apiKey;
		const customer = authReq.customer;

		let conversation = null;

		try {
			conversation = await conversationService.startConversation({
				organizationId: organization?.id as string,
				customerId: customer?.id as string,
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
				customerId: customer?.id,
			},
		});
	},
);

export const getMessages: RequestHandler = asyncHandler(
	async (req: Request, res: Response) => {
		const authReq = req as AuthenticatedWidgetRequest;
		const { id: conversationId } = authReq.params;
		const apiKeyRecord = authReq.apiKey;

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
