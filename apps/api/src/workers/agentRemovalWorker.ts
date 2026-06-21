import { Worker } from "bullmq";
import { redis } from "../config/redis.js";
import prisma from "../config/prisma.js";

export const agentRemovalWorker = new Worker(
	"agentRemoval",
	async (job) => {
		const { userId } = job.data;

		console.log(`[Worker] Starting removal for support agent: ${userId}`);

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { scheduledDeletionAt: true },
		});

		if (!user || !user.scheduledDeletionAt) {
			console.log(`[Worker] Removal cancelled or user not found for: ${userId}`);
			return;
		}

		try {
			await prisma.$transaction([
				prisma.ticket.updateMany({
					where: { assignedToId: userId },
					data: { assignedToId: null },
				}),
				prisma.invitation.deleteMany({ where: { invitedById: userId } }),
				prisma.user.delete({ where: { id: userId } }),
			]);
			console.log(`[Worker] Successfully removed support agent: ${userId}`);
		} catch (error) {
			console.error(`[Worker] Failed to remove support agent: ${userId}`, error);
			throw error;
		}
	},
	{ connection: redis as any },
);

agentRemovalWorker.on("completed", (job) => {
	console.log(`[Worker] Job ${job.id} completed successfully`);
});

agentRemovalWorker.on("failed", (job, err) => {
	console.error(`[Worker] Job ${job?.id} failed with error: ${err.message}`);
});
