import prisma from "src/config/prisma.js";

export default async function bulkInsertChunks(chunks: { content: string; embedding: number[]; chunkIndex: number }[], documentId: string, organizationId: string) {
	const valueStrings = chunks.map((_, i) => `(gen_random_uuid(), $${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}::vector, $${i * 5 + 5})`).join(", ");
	/*
  "($1, $2::vector), .. ($i, $i+1::vector)"
  */

	const flatValues = chunks.flatMap((chunk) => [documentId, organizationId, chunk.content, `[${chunk.embedding.join(",")}]`, chunk.chunkIndex]);

	/*
  [
  "Prisma is an ORM",
  "[0.1,0.2,0.3]",

  "Postgres database",
  "[0.4,0.5,0.6]"
  ]
  */
	/* this step is needed so postgres can cast string to vector*/

	// we needed to add id here manually because the @default(uuid()) is a Prisma-level default, not a database-level default and this is raw execution
	await prisma.$executeRawUnsafe(`INSERT INTO "document_chunks" (id, "documentId", "organizationId", content, embedding, "chunkIndex") VALUES ${valueStrings}`, ...flatValues);

	/*
  $1 = first chunk content
  $2 = first chunk embedding

  $3 = second chunk content
  $4 = second chunk embedding
  */
}
