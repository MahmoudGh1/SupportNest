import type { AgentTier, ResolutionTier } from "generated/prisma/enums.js";

export interface CSATShape {
	average: number;
	totalRatings: number;
}

export interface SummaryResponseShape {
	totalConversations: number;
	resolutionByTier: ResolutionTier;
	escalationRate: number;
	avgResolutionTimeMs: number;
	csat: CSATShape;
}

export interface AnalyticsJobData {
	conversationId: string;
	organizationId: string;
}
