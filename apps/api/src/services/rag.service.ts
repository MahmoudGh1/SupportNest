import prisma from "src/config/prisma.js";
import { queryEmbeddings, model } from "../config/langChain.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentAction, AgentTier, MessageTier } from "generated/prisma/enums.js";

interface ChunkResult {
	content: string;
	similarity: number;
}

export async function askTier0Agent(question: string, organizationId: string): Promise<any> {
	const questionVector = await queryEmbeddings.embedQuery(question);
	const vectorLiteral = `[${questionVector.join(",")}]`;

	const chunks = await prisma.$queryRaw<ChunkResult[]>`
    SELECT
      content,
      1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
    FROM document_chunks
    WHERE "organizationId" = ${organizationId}::uuid
    ORDER BY embedding <=> ${vectorLiteral}::vector
    LIMIT 5
  `;

	if (chunks.length === 0) {
		return "Oh. about that thing. maybe you are talking about something else we don't have.";
	}

	const context = chunks.map((chunk, i) => `[Source ${i + 1}]:\n${chunk.content}`).join("\n\n");

	const response = await model.invoke([
		new SystemMessage(`
            You are a helpful support assistant.
            Answer the user's question using ONLY the context provided below.
            If the context does not contain enough information, say 'Oh. about that thing. maybe you are talking about something else we don't have.'.
            Do not make up information.
            don't provide explanations.
            return in JSON Format only, no markdown, no explanation:
            {
              agentText: string,
              confidenceScore: number
            }

            Context: ${context}
    `),
		new HumanMessage(question),
	]);
  console.log(response.usage_metadata)

	const raw = typeof response.content === "string" ? response.content : (response.content[0] as { text: string }).text;

	const parsed = JSON.parse(raw);

	const data = {
		responseText: parsed.agentText,
		action: AgentAction.NO_MATCH,
		tier: MessageTier.TIER1,
		agentLog: {
			tier: AgentTier.TIER1,
			confidenceScore: parsed.confidenceScore,
			latencyMs: 1500,
			tokensUsed: response.usage_metadata,
		},
	};
	return data ;
}