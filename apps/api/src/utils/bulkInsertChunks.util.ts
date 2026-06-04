import prisma from "src/lib/prisma.js";

export default async function bulkInsertChunks(
	chunks: { content: string; embedding: number[]; chunkIndex: number }[],
	documentId: string,
	orgId: string,
) {
	const valueStrings = chunks
		.map(
			(_, i) =>
				`($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}::vector)`,
		)
		.join(", ");
	/*
  "($1, $2::vector), .. ($i, $i+1::vector)"
  */

	const flatValues = chunks.flatMap((chunk) => [
		documentId,
		orgId,
		chunk.content,
		`[${chunk.embedding.join(",")}]`,
		chunk.chunkIndex,
	]);

	/*
  [
  "Prisma is an ORM",
  "[0.1,0.2,0.3]",

  "Postgres database",
  "[0.4,0.5,0.6]"
  ]
  */
	/* this step is needed so postgres can cast string to vector*/
	await prisma.$executeRawUnsafe(
		`INSERT INTO "DocumentChunk" (document_id, organization_id, content, embedding, chunk_index) VALUES ${valueStrings}`,
		...flatValues,
	);

	/*
  $1 = first chunk content
  $2 = first chunk embedding

  $3 = second chunk content
  $4 = second chunk embedding
  */
}
