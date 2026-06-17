/* 
- aggregates conversation_analytics rows for an org filtered by date
preset (today / 7d / 30d)
- returns the dashboard payload
*/

import prisma from "src/config/prisma.js";
import type { SummaryResponseShape } from "src/types/analytics.types.js";

type DateRange = "today" | "7d" | "30d";

// Converts the range param into a "since" date for filtering conversation_analytics.created_at
function getStartDate(range: DateRange): Date {
	const date = new Date();

	if (range === "today") {
		date.setHours(0, 0, 0, 0); // midnight of today, local server time
	} else if (range === "7d") {
		date.setDate(date.getDate() - 7);
	} else {
		date.setDate(date.getDate() - 30);
	}

	return date;
}

/**
  model ConversationAnalytics {
  id                  String         @id @default(uuid()) @db.Uuid
  conversationId      String         @unique @db.Uuid
  organizationId      String         @db.Uuid
  resolvedByTier      ResolutionTier
  totalMessages       Int
  firstResponseTimeMs Int
  resolutionTimeMs    Int
  escalatedToTier2    Boolean        @default(false)
  escalatedToHuman    Boolean        @default(false)
  tokensUsed          Int
  csatScore           Int?
  inferredSentiment   Sentiment?
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
  conversation        Conversation   @relation(fields: [conversationId], references: [id])
  organization        Organization   @relation(fields: [organizationId], references: [id])

  @@index([organizationId])
  @@map("conversation_analytics")
}

*/

export async function getAnalyticsSummary(
	organizationId: string,
	range: DateRange,
): Promise<SummaryResponseShape> {
	const startDate = getStartDate(range);

	// Shared filter — every query below scopes to this org + date range
	const whereClause = {
		organizationId: organizationId,
		createdAt: { gte: startDate },
	};

	// Query 1: count of conversations per resolved_by_tier value
	// This gives us both the breakdown AND the total (sum of all group counts)
	const resolutionGroups = await prisma.conversationAnalytics.groupBy({
		by: ["resolvedByTier"],
		where: whereClause,
		_count: true,
	});

	// Query 2: averages across the same scoped rows
	const averages = await prisma.conversationAnalytics.aggregate({
		where: whereClause,
		_avg: {
			resolutionTimeMs: true,
			csatScore: true,
		},
	});

	// Query 3: how many conversations escalated to human (for escalation rate)
	const escalatedCount = await prisma.conversationAnalytics.count({
		where: { ...whereClause, escalatedToHuman: true },
	});

	// --- Shape the response ---

	// Sum all group counts to get the total
	const totalConversations = resolutionGroups.reduce(
		(sum, g) => sum + g._count,
		0,
	);

	// Build resolutionByTier with all 5 possible values defaulting to 0,
	// then fill in actual counts from the groupBy result
	const resolutionByTier = {
		TIER0: 0,
		TIER1: 0,
		TIER2: 0,
		HUMAN: 0,
		UNRESOLVED: 0,
	};

	for (const group of resolutionGroups) {
		resolutionByTier[group.resolvedByTier] = group._count;
	}

	// Escalation rate as a percentage, guarding against divide-by-zero
	const escalationRate =
		totalConversations > 0 ? (escalatedCount / totalConversations) * 100 : 0;

	return {
		totalConversations,
		resolutionByTier,
		escalationRate: Math.round(escalationRate * 10) / 10, // round to 1 decimal
		avgResolutionTimeMs: averages._avg.resolutionTimeMs ?? 0,
		csat: {
			average: averages._avg.csatScore ?? 0,
		},
	};
}
