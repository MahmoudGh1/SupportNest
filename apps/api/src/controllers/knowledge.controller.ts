import prisma from "src/config/prisma.js";
import { uploadToCloudinary } from "src/config/uploadToCloudinary.js";
import AppError from "src/utils/appError.js";
import asyncHandler from "src/utils/asyncHandler.js";
import type { Response, RequestHandler } from "express";
import type { AuthenticatedRequest } from "src/types/auth.types.js";
import { knowledgeQueue } from "src/queues/knowledgeQueue.js";

export const uploadDocument: RequestHandler = asyncHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const userId = req.user?.sub;
		const { orgId } = req.params;
		const { title, type } = req.body;
		const file = req.file; // Buffer from multer memoryStorage

		if (!file) throw new AppError("No file provided", 400);

		// 1. Upload raw file to Cloudinary
		const storagePath = await uploadToCloudinary(
			file.buffer,
			`supportnest/${orgId}/knowledge`, // folder
			`${Date.now()}-${title}`, // public_id
		);

		// 2. Save document record in Postgres via Prisma
		const doc = await prisma.knowledgeDocument.create({
			data: {
				organizationId: orgId as string,
				title,
				type, // 'pdf' | 'word doc' ...etc
				storagePath: storagePath, // Cloudinary URL
				status: "PROCESSING",
				createdById: userId as string,
			},
		});

		// 3. Queue chunking + embedding job in BullMQ
		await knowledgeQueue.add("process-document", {
			documentId: doc.id,
			storagePath,
			orgId,
		});

		res.status(202).json({ documentId: doc.id, status: "PROCESSING" });
	},
);
