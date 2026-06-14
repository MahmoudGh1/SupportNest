import type { Response, RequestHandler } from "express";
import type { AuthenticatedRequest } from "src/types/auth.types.js";
import prisma from "src/config/prisma.js";
import AppError from "src/utils/appError.js";
import asyncHandler from "src/utils/asyncHandler.js";
import type { UuidFilter } from "generated/prisma/commonInputTypes.js";

export const getToolsByDocument: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
	const { documentId } = req.params;
	const organizationId = req.user?.organizationId;

	const document = await prisma.knowledgeDocument.findUnique({
		where: { id: documentId as string },
		select: {
			organizationId: true,
			title: true,
			toolCount: true,
			activeToolCount: true,
			disabledToolCount: true,
		},
	});

	if (!document || document.organizationId !== organizationId) {
		throw new AppError("Document not found", 404);
	}

	const tools = await prisma.toolDefinition.findMany({
		where: { documentId: documentId as string },
		orderBy: { createdAt: "asc" },
		select: {
			id: true,
			name: true,
			description: true,
			method: true,
			path: true,
			parameters: true,
			responseSchema: true,
			isActive: true,
			createdAt: true,
		},
	});

	res.status(200).json({
		document: {
			title: document.title,
			toolCount: document.toolCount,
			activeToolCount: document.activeToolCount,
			disabledToolCount: document.disabledToolCount,
		},
		tools,
	});
});

export const toggleTool: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
	const { toolId } = req.params;
	const organizationId = req.user?.organizationId;

	const tool = await prisma.toolDefinition.findUnique({
		where: { id: toolId },
		include: { knowledge_documents: true },
	});

	console.log(tool)

	if (!tool || tool.organizationId !== organizationId) {
		throw new AppError("Tool not found", 404);
	}

	const updatedTool = await prisma.toolDefinition.update({
		where: { id: toolId },
		data: { isActive: !tool.isActive },
	});

	if (tool.documentId) {
		const counts = await prisma.toolDefinition.groupBy({
			by: ["isActive"],
			where: { documentId: tool.documentId },
			_count: true,
		});

		const activeCount = counts.find((c) => c.isActive)?._count ?? 0;
		const disabledCount = counts.find((c) => !c.isActive)?._count ?? 0;

		await prisma.knowledgeDocument.update({
			where: { id: tool.documentId },
			data: {
				activeToolCount: activeCount,
				disabledToolCount: disabledCount,
			},
		});
	}

	res.status(200).json({
		id: updatedTool.id,
		isActive: updatedTool.isActive,
		message: `Tool ${updatedTool.isActive ? "enabled" : "disabled"} successfully`,
	});
});

export const getActiveToolsForOrg: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
	const organizationId = req.user?.organizationId;

	const tools = await prisma.toolDefinition.findMany({
		where: { organizationId, isActive: true },
		orderBy: { createdAt: "asc" },
	});

	res.status(200).json({ tools });
});

export const getAllToolsForOrg: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
	const organizationId = req.user?.organizationId as string | UuidFilter<"ToolDefinition">;

	const tools = await prisma.toolDefinition.findMany({
		where: { organizationId },
		orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
		select: {
			id: true,
			name: true,
			description: true,
			method: true,
			path: true,
			isActive: true,
			createdAt: true,
			knowledge_documents: {
				select: { title: true, type: true },
			},
		},
	});

	res.status(200).json({ tools });
});
