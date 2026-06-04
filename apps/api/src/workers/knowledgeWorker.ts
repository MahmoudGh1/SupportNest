import { Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import prisma from "src/lib/prisma.js";
import bulkInsertChunks from "src/utils/bulkInsertChunks.util.js";

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

		const pdfBuffer = await fetch(fileUrl).then((r) => r.arrayBuffer());
		// const chunks = await splitDocument(pdfBuffer);
		// const embeddings = await embedChunks(chunks);
		// await bulkInsertChunks(
		// 	chunks.map((text, i) => ({
		// 		content: text,
		// 		embedding: embeddings[i],
		// 		chunkIndex: i,
		// 	})),
		// 	documentId,
		// 	orgId,
		// );
	},
	{ connection: redis as any },
);

knowledgeWorker.on("completed", (job) => {
	console.log(`Document ${job.id} processed successfully`);
});

knowledgeWorker.on("failed", (job, err) => {
	console.error(`Document ${job?.id} failed:`, err.message);
});
