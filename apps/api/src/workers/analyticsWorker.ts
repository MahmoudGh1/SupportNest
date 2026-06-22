/* 
fires when a conversation closes 
reads messages, agent_logs and csat_ratings
compute metrics and then writes one row to conversation_analytics
*/

import { Worker, Job } from "bullmq";
import { redis } from "../config/redis.js";

import {
	AgentAction,
	MessageRole,
	ResolutionTier,
} from "generated/prisma/enums.js";
import prisma from "src/config/prisma.js";

import type { AnalyticsJobData } from "../types/analytics.types.js";

// function deriveResolvedByTier(
// 	logs: { tier: string; action: string }[],
// ): ResolutionTier {
// 	// who ultimately resolved this conversation?

// 	if (logs.some((l) => l.action === AgentAction.ESCALATED_TO_HUMAN))
// 		return ResolutionTier.HUMAN;

// 	const resolvedLog = logs.find((l) => l.action === AgentAction.RESOLVED);

// 	if (!resolvedLog) return ResolutionTier.UNRESOLVED;

// 	const tier = resolvedLog.tier;

// 	// Map the tier name directly to the return value
// 	if (tier === ResolutionTier.TIER2) return ResolutionTier.TIER2;
// 	if (tier === ResolutionTier.TIER1) return ResolutionTier.TIER1;
// 	if (tier === ResolutionTier.TIER0) return ResolutionTier.TIER0;

// 	return ResolutionTier.UNRESOLVED;
// }

function deriveResolvedByTier(
    logs: { tier: string; action: string }[],
): ResolutionTier {
    // ✅ Check RESOLVED first — it's the source of truth
    // Use the LAST resolved log (the tier that ultimately closed it)
    const resolvedLog = [...logs].reverse().find((l) => l.action === AgentAction.RESOLVED);

    if (resolvedLog) {
        const tier = resolvedLog.tier;
        if (tier === ResolutionTier.TIER2) return ResolutionTier.TIER2;
        if (tier === ResolutionTier.TIER1) return ResolutionTier.TIER1;
        if (tier === ResolutionTier.TIER0) return ResolutionTier.TIER0;
        if (tier === "HUMAN")              return ResolutionTier.HUMAN;
    }

    // ✅ Only fall back to escalation check if no RESOLVED log exists
    if (logs.some((l) => l.action === AgentAction.ESCALATED_TO_HUMAN))
        return ResolutionTier.HUMAN;

    return ResolutionTier.UNRESOLVED;
}

async function processAnalyticsJob(job: Job<AnalyticsJobData>) {
	const { conversationId, organizationId } = job.data;

	const [conversation, messages, agentLogs, csatRating] = await Promise.all([
		prisma.conversation.findUnique({
			where: { id: conversationId },
			select: { createdAt: true, closedAt: true },
		}),
		prisma.message.findMany({
			where: { conversationId: conversationId },
			orderBy: { createdAt: "asc" },
			select: { role: true, createdAt: true },
		}),
		prisma.agentLog.findMany({
			where: { conversationId: conversationId },
			select: { tier: true, action: true, tokensUsed: true },
		}),
		prisma.csatRating.findUnique({
			where: { conversationId: conversationId },
			select: { score: true },
		}),
	]);

	if (!conversation) {
		throw new Error(`Conversation ${conversationId} not found`);
	}

	const totalMessages = messages.length;

	const firstCustomerMsg = messages.find(
		(m) => m.role === MessageRole.CUSTOMER,
	);
	const firstAiMsg = messages.find((m) => m.role === MessageRole.AI);
	const firstResponseTimeMs =
		firstCustomerMsg && firstAiMsg
			? new Date(firstAiMsg.createdAt).getTime() -
				new Date(firstCustomerMsg.createdAt).getTime()
			: null;

	const resolutionTimeMs = conversation.closedAt
		? new Date(conversation.closedAt).getTime() -
			new Date(conversation.createdAt).getTime()
		: null;

	const escalatedToTier2 = agentLogs.some(
		(l) => l.action === AgentAction.ESCALATED_TO_TIER2,
	);
	const escalatedToHuman = agentLogs.some(
		(l) => l.action === AgentAction.ESCALATED_TO_HUMAN,
	);
	const totalTokens = agentLogs.reduce(
		(sum, l) => sum + (l.tokensUsed ?? 0),
		0,
	);
	const resolvedByTier = deriveResolvedByTier(agentLogs);

	await prisma.conversationAnalytics.upsert({
		where: { conversationId: conversationId },
		update: {
			resolvedByTier: resolvedByTier,
			totalMessages: totalMessages,
			firstResponseTimeMs: firstResponseTimeMs ?? 0,
			resolutionTimeMs: resolutionTimeMs as number,
			escalatedToTier2: escalatedToTier2,
			escalatedToHuman: escalatedToHuman,
			tokensUsed: totalTokens,
			csatScore: csatRating?.score ?? null,
			updatedAt: new Date(),
		},
		create: {
			conversationId: conversationId,
			organizationId: organizationId,
			resolvedByTier: resolvedByTier,
			totalMessages: totalMessages,
			firstResponseTimeMs: firstResponseTimeMs ?? 0,
			resolutionTimeMs: resolutionTimeMs ?? 0,
			escalatedToTier2: escalatedToTier2,
			escalatedToHuman: escalatedToHuman,
			tokensUsed: totalTokens,
			csatScore: csatRating?.score ?? null,
		},
	});
}

export const analyticsWorker = new Worker<AnalyticsJobData>(
	"compute-analytics",
	processAnalyticsJob,
	{ connection: redis as any, concurrency: 5 },
);

analyticsWorker.on("failed", (job, err) => {
	console.error(`[analyticsWorker] Job ${job?.id} failed:`, err.message);
});

analyticsWorker.on("ready", () => {
	console.log("[analyticsWorker] connected and listening for jobs");
});
