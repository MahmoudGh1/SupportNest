import { Worker, Job } from "bullmq";
import { redis } from "../config/redis.js";
import type { ReportJobData } from "src/types/report.types.js";
import prisma from "src/config/prisma.js";
import { generateReportData } from "src/services/reporter.service.js";
import { AgentTier, ConversationStatus } from "generated/prisma/enums.js";
import AppError from "src/utils/appError.js";

async function getConversationUsageStats(conversationId: string) {
	// fetch agentLogs related
	const agentLogs = await prisma.agentLog.findMany({
		where: {
			conversationId,
			tier: {
				not: AgentTier.ROUTER,
			},
		},
		select: {
			tier: true,
			tokensUsed: true,
		},
	});

	// extract unique agents involved
	const agentsInvolved = [...new Set(agentLogs.map((log) => log.tier))];

	// sum up the total tokens used
	const totalTokensUsed = agentLogs.reduce(
		(sum, log) => sum + (log.tokensUsed || 0),
		0,
	);

	return { agentsInvolved, totalTokensUsed };
}

async function processReportJob(job: Job<ReportJobData>) {
	const { conversationId, organizationId } = job.data;

	// fetch conversation
	const conversation = await prisma.conversation.findUnique({
		where: {
			id: conversationId,
		},
		include: {
			messages: {
				orderBy: {
					createdAt: "desc",
				},
				take: 20, // Limit to the last 20 messages to save tokens
				select: { role: true, content: true },
			}, // This populates the messages relation
		},
	});

	if (!conversation) {
		throw new Error(`Conversation ${conversationId} not found`);
	}

	const existingReport = await prisma.report.findUnique({
		where: { conversationId },
	});

	if (existingReport) {
		throw new AppError(
			"a report is only generated once per escalated conversation",
		);
	}

	// -- // Reverse so the llm reads them from oldest to newest
	const conversationHistory = conversation.messages.toReversed();

	// call LLM

	const { summary, issueType, resolution, language, sentiment } =
		await generateReportData(conversationHistory);

	const { agentsInvolved, totalTokensUsed } =
		await getConversationUsageStats(conversationId);

	// write Report row
	const createReport = await prisma.report.create({
		data: {
			organizationId,
			conversationId,
			summary,
			issueType,
			language,
			resolution,
			sentiment: sentiment.toUpperCase(),
			wasEscalated: true,
			resolvedByAi: false,
			tokensUsed: totalTokensUsed,
			tiersVisited: agentsInvolved,
		},
	});
}

export const reportWorker = new Worker<ReportJobData>(
	"generate-report",
	processReportJob,
	{ connection: redis as any, concurrency: 5 },
);

reportWorker.on("failed", (job, err) => {
	console.error(`[reportWorker] Job ${job?.id} failed:`, err.message);
});

reportWorker.on("ready", () => {
	console.log("[reportWorker] connected and listening for jobs");
});
