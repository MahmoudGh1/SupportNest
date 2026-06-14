import type { Response, RequestHandler } from "express";
import type { AuthenticatedRequest } from "src/types/auth.types.js";
import prisma from "src/config/prisma.js";
import AppError from "src/utils/appError.js";
import asyncHandler from "src/utils/asyncHandler.js";

export const getReportsController: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
	const organizationId = req.user?.organizationId;
	if (!organizationId) throw new AppError("Unauthorized", 401);

	const reports = await prisma.report.findMany({
		where: { organizationId },
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			conversationId: true,
			summary: true,
			issueType: true,
			resolution: true,
			language: true,
			sentiment: true,
			tiersVisited: true,
			wasEscalated: true,
			resolvedByAi: true,
			tokensUsed: true,
			createdAt: true,
		},
	});

	res.status(200).json({ reports });
});

// Get a single report
export const getReportByIdController: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
	const organizationId = req.user?.organizationId;
	const { id } = req.params;

	if (!organizationId) throw new AppError("Unauthorized", 401);

	const report = await prisma.report.findUnique({
		where: { id },
		include: {
			conversation: {
				select: {
					id: true,
					conversationStatus: true,
					createdAt: true,
					customer: {
						select: {
							id: true,
							name: true,
							email: true,
							isAnonymous: true,
						},
					},
					messages: {
						orderBy: { createdAt: "asc" },
						select: {
							id: true,
							role: true,
							content: true,
							createdAt: true,
						},
					},
				},
			},
		},
	});

	if (!report || report.organizationId !== organizationId) {
		throw new AppError("Report not found", 404);
	}

	res.status(200).json(report);
});
