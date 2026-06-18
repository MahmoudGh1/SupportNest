import prisma from "src/config/prisma.js";
import AppError from "src/utils/appError.js";
import asyncHandler from "src/utils/asyncHandler.js";
import type { Response, RequestHandler } from "express";
import type { AuthenticatedRequest } from "src/types/auth.types.js";
import { knowledgeQueue } from "src/queues/knowledgeQueue.js";
import { PrismaClientKnownRequestError } from "generated/prisma/internal/prismaNamespace.js";
import {
	buildFilter,
	buildPagination,
	type QueryParams,
} from "src/utils/filterBuilder.js";
import * as knowledgeService from "src/services/knowledge.service.js";

export const uploadDocument: RequestHandler = asyncHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const userId = req.user?.sub;
		const organizationId = req.user?.organizationId;
		const { title, type } = req.body;
		const file = req.file;
		if (!file) throw new AppError("No file provided", 400);
		if (!userId || !organizationId)
			throw new AppError("invalid upload operation", 400);

		const { document, storagePath } = await knowledgeService.uploadDocument({
			title,
			type,
			file,
			userId,
			organizationId,
		});

		res.status(200).json({ success: true, data: document });
	},
);

export const getKnowledgeDocuments: RequestHandler = asyncHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const organizationId = req.user?.organizationId;
		const organization = await prisma.organization.findUnique({
			where: { id: organizationId as string },
		});

		if (!organization) throw new AppError("organization not found", 404);

		const filter = buildFilter(req.query);
		const { page, limit, skip } = buildPagination(req.query as QueryParams);

		const baseWhere = { organizationId: organization.id, ...filter };

		const [total, documents] = await Promise.all([
			prisma.knowledgeDocument.count({ where: baseWhere }),
			prisma.knowledgeDocument.findMany({
				where: baseWhere,
				skip,
				take: limit,
				orderBy: { createdAt: "desc" },
			}),
		]);

		const totalPages = Math.ceil(total / limit);

		res.status(200).json({
			success: true,
			message: "documents fetched successfully",
			data: { documents },
			metadata: {
				total,
				page,
				limit,
				totalPages,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1,
			},
		});
	},
);

export const deleteKnowledgeDocument: RequestHandler = asyncHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const organizationId = req.user?.organizationId;
		const docId = req.params.docId;

		const organization = await prisma.organization.findUnique({
			where: { id: organizationId as string },
			select: { id: true, isActive: true },
		});

		if (!organization || organization.isActive === false)
			throw new AppError("invalid document delete operation", 400);

		try {
			await prisma.documentChunk.deleteMany({
				where: { documentId: docId as string },
			});

			const document = await prisma.knowledgeDocument.delete({
				where: {
					id: docId as string,
					organizationId: organization.id as string,
				},
			});

			return res.status(200).json({
				success: true,
				message: "Document deleted successfully",
				data: document,
			});
		} catch (error) {
			if (
				error instanceof PrismaClientKnownRequestError &&
				error.code === "P2025"
			) {
				return res.status(404).json({
					success: false,
					error: "Not Found",
					message: `Knowledge Document with ID ${docId} does not exist.`,
				});
			}
			throw error;
		}
	},
);

export const uploadSwaggerUrl: RequestHandler = asyncHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const userId = req.user?.sub;
		const organizationId = req.user?.organizationId;
		const { title, swaggerUrl } = req.body;

		if (!swaggerUrl) throw new AppError("swaggerUrl is required", 400);

		try {
			new URL(swaggerUrl);
		} catch {
			throw new AppError("swaggerUrl must be a valid URL", 400);
		}

		const apiConfig = await prisma.businessApiConfig.findUnique({
			where: { organizationId: organizationId as string },
		});
		if (!apiConfig || !apiConfig.isVerified) {
			throw new AppError(
				"You must configure and verify your API connection before adding API documentation.",
				400,
			);
		}

		const doc = await prisma.knowledgeDocument.create({
			data: {
				organizationId: organizationId as string,
				title: title || swaggerUrl,
				type: "SWAGGER_URL",
				storagePath: swaggerUrl,
				status: "PROCESSING",
				createdById: userId as string,
			},
		});

		await knowledgeQueue.add("process-document", {
			documentId: doc.id,
			fileUrl: swaggerUrl,
			organizationId,
		});

		res.status(202).json({ documentId: doc.id, status: "PROCESSING" });
	},
);
