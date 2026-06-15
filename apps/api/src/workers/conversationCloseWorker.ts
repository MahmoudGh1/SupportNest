// src/workers/conversationCloseWorker.ts
import { Worker } from "bullmq";
import prisma from "src/config/prisma.js";
import { redis } from "src/config/redis.js";

export const conversationCloseWorker = new Worker(
	"conversation-close",
	async (job) => {
		const { conversationId, organizationId } = job.data;

		// mark the conversation as closed — this is what the analytics
		// worker watches for (per schema design: conversation_status drives lifecycle)
		await prisma.conversation.update({
			where: { id: conversationId },
			data: {
				conversationStatus: "CLOSED",
				closedAt: new Date(),
			},
		});
		console.log(`[close-worker] closed conversation ${conversationId}`);
		// TODO: enqueue analytics job here once analyticsQueue.ts exists
		// await analyticsQueue.add('compute-analytics', { conversationId, organizationId });
	},
	{ connection: redis as any },
);
