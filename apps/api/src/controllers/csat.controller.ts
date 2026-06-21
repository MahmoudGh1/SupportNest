import prisma from "src/config/prisma.js";
import type { Request, Response, RequestHandler } from "express";
import type { AuthenticatedWidgetRequest } from "src/types/apiKey.types.js";
import asyncHandler from "src/utils/asyncHandler.js";

export const submit: RequestHandler = asyncHandler(
	async (req: Request, res: Response) => {
		const authReq = req as AuthenticatedWidgetRequest;

		const conversationId = authReq.params.conversationId as string;
		const { rating } = authReq.body;

		const conversation = await prisma.conversation.findUnique({
			where: { id: conversationId as string },
		});
		console.log(
			conversationId,
			rating,
			authReq.organization,
			authReq.customer,
		);

		if (
			!conversation ||
			conversation.organizationId !== authReq.organization?.id
		) {
			return res.status(404).json({ message: "Conversation not found." });
		}

		if (conversation.customerId !== authReq.customer?.id) {
			return res.status(403).json({ message: "Not your conversation." });
		}

		try {
			const csatRating = await prisma.csatRating.create({
				data: {
					conversationId,
					organizationId: authReq.organization.id,
					customerId: authReq.customer.id,
					score: rating,
				},
			});
			return res.status(201).json({
				data: csatRating,
				message: "The conversation rating is submitted successfully",
				success: true,
			});
		} catch (err: any) {
			if (err.code === "P2002") {
				// unique constraint on conversationId — already rated
				return res
					.status(409)
					.json({ message: "This conversation has already been rated." });
			}
			throw err;
		}
	},
);
