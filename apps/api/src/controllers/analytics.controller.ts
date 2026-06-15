import type { RequestHandler } from "node_modules/@types/express/index.js";
import type {
	AuthenticatedRequest,
	JwtPayload,
} from "src/types/auth.types.js";
import asyncHandler from "src/utils/asyncHandler.js";
import type { Response } from "express";
import AppError from "src/utils/appError.js";
import { getAnalyticsSummary } from "src/services/analytics.service.js";

const VALID_RANGES = ["today", "7d", "30d"] as const;
type DateRange = (typeof VALID_RANGES)[number];

export const getSummary: RequestHandler = asyncHandler(
	async (req: AuthenticatedRequest, res: Response) => {
		const { organizationId } = req.user as JwtPayload;

		// Default to "7d" if not provided; validate against allowed values
		const range = (req.query.range as string) || "7d";

		if (!VALID_RANGES.includes(range as DateRange)) {
			throw new AppError(
				`Invalid range. Must be one of: ${VALID_RANGES.join(", ")}`,
				400,
			);
		}

		const summary = await getAnalyticsSummary(
			organizationId as string,
			range as DateRange,
		);

		res.status(200).json({
			success: true,
			data: summary,
		});
	},
);
