import { Worker } from "bullmq";
import { redis } from "../config/redis.js";
import prisma from "src/config/prisma.js";
import bulkInsertChunks from "src/utils/bulkInsertChunks.util.js";
import { ingestDocument } from "src/services/documentIngestion.service.js";

export const knowledgeWorker = new Worker(
	"process-document",
	async (job) => {
		const { documentId, fileUrl, orgId } = job.data;

		console.log(`Processing document ${documentId} for org ${orgId}`);

		// Steps for later:
		// 1. Download file from Cloudinary URL
		// 2. Extract text
		// 3. Chunk the text
		// 4. Embed chunks via OpenAI
		// 5. Store chunks + embeddings in pgvector
		try {
			await ingestDocument(fileUrl, documentId, orgId);

			await prisma.knowledgeDocument.update({
				where: { id: documentId },
				data: { status: "READY" },
			});
		} catch (error) {
			console.log("[Worker] ingestDocument failed for ${documentId}:", error);
			throw error;
		}
	},
	{ connection: redis as any },
);
console.log("Worker started and listening...");
knowledgeWorker.on("completed", (job) => {
	console.log(`Document ${job.id} processed successfully`);
});

knowledgeWorker.on("failed", async (job, err) => {
	console.error(`Document ${job?.id} failed:`, err.message);
	if (job?.data?.documentId) {
		await prisma.knowledgeDocument.update({
			where: { id: job.data.documentId },
			data: { status: "FAILED" },
		});
	}
});
