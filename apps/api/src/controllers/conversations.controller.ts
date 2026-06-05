import prisma from "src/config/prisma.js";
import AppError from "src/utils/appError.js";
import asyncHandler from "src/utils/asyncHandler.js";
import type { Response, RequestHandler } from "express";
import type { AuthenticatedRequest } from "src/types/auth.types.js";

export const startConversationController: RequestHandler = asyncHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const userId = req.user?.sub;
		// const userId = "c14a63e5-48d5-48af-b40e-c2432732cec4";

		res.status(200).json({ message: "successful" });
	},
);
