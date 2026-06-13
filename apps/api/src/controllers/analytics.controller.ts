import type { RequestHandler } from "node_modules/@types/express/index.js";
import type { AuthenticatedRequest } from "src/types/auth.types.js";
import asyncHandler from "src/utils/asyncHandler.js";
import type { Response } from "express";

export const summary: RequestHandler = asyncHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		res.status(200).json({ message: "respond" });
	},
);
