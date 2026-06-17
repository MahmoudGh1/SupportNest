import { Worker } from "bullmq";
import { redis } from "../config/redis.js";
import prisma from "src/config/prisma.js";
import bulkInsertChunks from "src/utils/bulkInsertChunks.util.js";
import { ingestDocument } from "src/services/documentIngestion.service.js";
import { extractToolsFromDocument } from "src/services/toolExtractor.service.js";

const API_DOC_TYPES = ["API_DOC", "SWAGGER_URL"];

export const knowledgeWorker = new Worker(
	"process-document",
	async (job) => {
		const { documentId, fileUrl, organizationId } = job.data;

		const document = await prisma.knowledgeDocument.findUnique({
			where: { id: documentId },
			select: { type: true },
		});

		if (!document) {
			throw new Error(`Document ${documentId} not found`);
		}

		// Steps for later:
		// 1. Download file from Cloudinary URL
		// 2. Extract text
		// 3. Chunk the text
		// 4. Embed chunks via OpenAI
		// 5. Store chunks + embeddings in pgvector
		try {
			if (API_DOC_TYPES.includes(document.type)) {
				await extractToolsFromDocument(
					documentId,
					organizationId,
					fileUrl,
					document.type,
				);
			} else {
				await ingestDocument(fileUrl, documentId, organizationId, document.type);
				await prisma.knowledgeDocument.update({
					where: { id: documentId },
					data: { status: "READY" },
				});
			}
		} catch (error) {
			throw error;
		}
	},
	{ connection: redis as any },
);

knowledgeWorker.on("completed", (job) => {
	console.log(`Document ${job.id} processed successfully`);
});

knowledgeWorker.on("failed", async (job, err) => {
	console.error(`Document ${job?.id} failed:`, err.message);

	const attemptsMade = job?.attemptsMade ?? 0;
	const maxAttempts = job?.opts?.attempts ?? 1;

	if (job?.data?.documentId && attemptsMade >= maxAttempts) {
		// only declare "FAILED" after all the attempts exhausted
		await prisma.knowledgeDocument.update({
			where: { id: job.data.documentId },
			data: { status: "FAILED" },
		});
	}
});

knowledgeWorker.on("ready", () => {
	console.log("[knowledgeWorker] connected and listening for jobs");
});
