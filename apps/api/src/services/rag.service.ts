import prisma from "src/config/prisma.js";
import { queryEmbeddings, model } from "../config/langChain.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
	AgentAction,
	AgentTier,
	MessageTier,
} from "generated/prisma/enums.js";
import type { Message } from "generated/prisma/client.js";

interface ChunkResult {
	content: string;
	similarity: number;
}

export async function askTier0Agent(
	question: string,
	organizationId: string,
	convesationId: string,
	conversationHistory: Message[],
): Promise<any> {
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

	const context = chunks
		.map((chunk, i) => `[Source ${i + 1}]:\n${chunk.content}`)
		.join("\n\n");

	const response = await model.invoke([
		new SystemMessage(`
        You are a customer support agent chatting with a customer over text/chat.
        Never reveal you are an AI or a bot.

        LANGUAGE & DIALECT:
        - Detect the language and dialect the user writes in and respond in the EXACT same language and dialect.
        - Egyptian Arabic → Egyptian Arabic slang. Don't mix in formal Arabic.

        TONE:
        - Detect the user's emotional tone and respond accordingly.
        - Angry/frustrated → calm, apologetic, reassuring. Acknowledge the feeling first.
        - Happy → warm and match their energy.
        - Confused → patient and simple.

        STYLE — THIS IS CRITICAL:
        - You are texting, not writing an essay. Keep it SHORT and natural.
        - One or two sentences max unless the answer truly requires more.
        - No bullet points. No lists. No structured formatting.
        - Never start with greetings like "يا هلا" or "أهلاً" every single message.
        - Don't over-explain. Just answer and stop.
        - Don't add "أنا هنا لو محتاج حاجة تانية" or similar filler closings.
        - Sound like a real person texting a friend, not a call center script.

        ANSWER RULES:
        - Use the context below as your knowledge base. Never quote or reference it directly.
        - If the context doesn't have the answer, say so briefly and naturally in the user's language.
        - Do not make up information.
        - if the answer is not in the knowledge base then response with agentText: i don't know what are you talking about it's not in our knowledge base
        - Only answer greeting message, and when user say anything outside the context of the knowledge base then tell him it's out of our specifications and tell him to ask the question or the issue he want.

        Return JSON only, no markdown:
        {
            "agentText": string,
            "confidenceScore": number
        }

        Context:
        ${context}
    `),
		new HumanMessage(question),
	]);
	console.log(response.usage_metadata);

	const raw =
		typeof response.content === "string"
			? response.content
			: (response.content[0] as { text: string }).text;

	const parsed = JSON.parse(raw);

	const usage = response.usage_metadata as
		| { total_tokens?: number }
		| undefined;

	const data = {
		responseText: parsed.agentText,
		action: AgentAction.NO_MATCH,
		tier: MessageTier.TIER1,
		agentLog: {
			tier: AgentTier.TIER1,
			confidenceScore: parsed.confidenceScore,
			latencyMs: 1500,
			tokensUsed: usage?.total_tokens ?? 0,
		},
	};

	return data;
}
