import { Worker } from "bullmq";
import { redisConfig } from "../config/redis.js";
import prisma from "../config/prisma.js";

export const orgDeletionWorker = new Worker(
	"orgDeletion",
	async (job) => {
		const { orgId } = job.data;

		console.log(`[Worker] Starting hard delete for organization: ${orgId}`);

		const org = await prisma.organization.findUnique({
			where: { id: orgId },
			select: { scheduledDeletionAt: true },
		});

		// Check if deletion was cancelled
		if (!org || !org.scheduledDeletionAt) {
			console.log(`[Worker] Deletion cancelled or org not found for: ${orgId}`);
			return;
		}

		// Perform deep delete (same as deleteOrganization logic but hard)
		try {
			await prisma.$transaction([
				prisma.agentLog.deleteMany({ where: { conversation: { organizationId: orgId } } }),
				prisma.message.deleteMany({ where: { conversation: { organizationId: orgId } } }),
				prisma.conversationAnalytics.deleteMany({ where: { organizationId: orgId } }),
				prisma.csatRating.deleteMany({ where: { organizationId: orgId } }),
				prisma.report.deleteMany({ where: { organizationId: orgId } }),
				prisma.ticket.deleteMany({ where: { organizationId: orgId } }),
				prisma.conversation.deleteMany({ where: { organizationId: orgId } }),
				prisma.apiKey.deleteMany({ where: { organizationId: orgId } }),
				prisma.documentChunk.deleteMany({ where: { organizationId: orgId } }),
				prisma.knowledgeDocument.deleteMany({ where: { organizationId: orgId } }),
				prisma.toolDefinition.deleteMany({ where: { organizationId: orgId } }),
				prisma.businessApiConfig.deleteMany({ where: { organizationId: orgId } }),
				prisma.invitation.deleteMany({ where: { organizationId: orgId } }),
				prisma.payment.deleteMany({ where: { organizationId: orgId } }),
				prisma.user.deleteMany({ where: { organizationId: orgId } }),
				prisma.customer.deleteMany({ where: { organizationId: orgId } }),
				prisma.organization.delete({ where: { id: orgId } }),
			]);
			console.log(`[Worker] Successfully deleted organization: ${orgId}`);
		} catch (error) {
			console.error(`[Worker] Failed to delete organization: ${orgId}`, error);
			throw error;
		}
	},
	{ connection: redisConfig },
);

orgDeletionWorker.on("completed", (job) => {
	console.log(`[Worker] Job ${job.id} completed successfully`);
});

orgDeletionWorker.on("failed", (job, err) => {
	console.error(`[Worker] Job ${job?.id} failed with error: ${err.message}`);
});
