import { chunkText } from "src/config/chunker.js";
import { embeddings } from "src/config/embeddings.js";
import { extractTextFromUrl } from "src/config/pdf.js";
import bulkInsertChunks from "src/utils/bulkInsertChunks.util.js";

export async function ingestDocument(fileUrl: string, documentId: string, organizationId: string) {
	const text = await extractTextFromUrl(fileUrl);

	const chunks = await chunkText(text);

	const vectors = await embeddings.embedDocuments(chunks);

	await bulkInsertChunks(
		chunks.map((content, i) => ({
			content,
			embedding: vectors[i] as number[],
			chunkIndex: i,
		})),
		documentId,
		organizationId,
	);
}
