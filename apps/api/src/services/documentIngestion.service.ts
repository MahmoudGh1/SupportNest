import { chunkText } from "src/config/chunker.js";
import { extractRowsFromUrl, rowToChunkText } from "src/config/csv.js";
import { embeddings } from "src/config/embeddings.js";
import { extractTextFromUrl } from "src/config/pdf.js";
import prisma from "src/config/prisma.js";
import AppError from "src/utils/appError.js";
import bulkInsertChunks from "src/utils/bulkInsertChunks.util.js";

export async function ingestDocument(
	fileUrl: string,
	documentId: string,
	orgId: string,
	type: string,
) {
	/* -- the lines below is important to ensure partial chunks created is fully removed before a new retry to do a failed background job */
	const existingChunkCount = await prisma.documentChunk.count({
		where: {
			documentId,
		},
	});

	if (existingChunkCount > 0) {
		const deleted = await prisma.documentChunk.deleteMany({
			where: {
				documentId,
			},
		});
		console.log(
			`Removed ${deleted.count} existing chunks for document ${documentId}`,
		);
	}
	/* ------ */

	let chunks: string[];

	if (type === "CSV") {
		const rows = await extractRowsFromUrl(fileUrl);
		chunks = rows.map(rowToChunkText);
	} else {
		const text = await extractTextFromUrl(fileUrl);
		chunks = await chunkText(text);
	}

	if (chunks.length === 0) {
		throw new AppError("Document produced no content to embed");
	}

	const vectors = await embeddings.embedDocuments(chunks);

	await bulkInsertChunks(
		chunks.map((content, i) => ({
			content,
			embedding: vectors[i] as number[],
			chunkIndex: i,
		})),
		documentId,
		orgId,
	);
}
