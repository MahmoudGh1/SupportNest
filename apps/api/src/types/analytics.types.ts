import type { AgentTier, ResolutionTier } from "generated/prisma/enums.js";

export interface SummaryResponseShape {
	totalConversations: number;
	resolutionByTier: {
		TIER0: number;
		TIER1: number;
		TIER2: number;
		HUMAN: number;
		UNRESOLVED: number;
	};
	escalationRate: number;
	avgResolutionTimeMs: number;
	csat: {
		average: number;
	};
}

export interface AnalyticsJobData {
	conversationId: string;
	organizationId: string;
}
