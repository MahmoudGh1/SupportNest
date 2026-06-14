import prisma from "src/config/prisma.js";
import { queryEmbeddings, model } from "../config/langChain.js";
import {
	HumanMessage,
	SystemMessage,
	AIMessage,
	BaseMessage,
} from "@langchain/core/messages";
import {
	AgentAction,
	AgentTier,
	MessageTier,
} from "generated/prisma/enums.js";
import type { MemoryMessage } from "../utils/conversationMemory.utils.js";
import type { PipelineContext, TierResponse } from "src/types/agent.types.js";
import { chunkText } from "src/config/chunker.js";

interface ChunkResult {
	content: string;
	similarity: number;
}

// export async function askTier0Agent(question: string, organizationId: string, convesationId: string = "Empty", conversationHistory: MemoryMessage[] = []): Promise<any> {
// const questionVector = await queryEmbeddings.embedQuery(question);
// const vectorLiteral = `[${questionVector.join(",")}]`;

// const chunks = await prisma.$queryRaw<ChunkResult[]>`
//     SELECT
//       content,
//       1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
//     FROM document_chunks
//     WHERE "organizationId" = ${organizationId}::uuid
//     ORDER BY embedding <=> ${vectorLiteral}::vector
//     LIMIT 5
//   `;
// console.log("[RAG] chunks found:", chunks.length, "for org:", organizationId);

// if (chunks.length === 0) {
// 	return buildResponse(
// 		"Oh. about that thing. maybe you are talking about something else we don't have.",
// 		AgentAction.NO_MATCH,
// 		0,
// 		0,
// 	);
// }

// const context = chunks
// 	.map((chunk, i) => `[Source ${i + 1}]:\n${chunk.content}`)
// 	.join("\n\n");

// const historyMessages = conversationHistory.flatMap((msg): BaseMessage[] => {
// 	if (msg.role === "customer") return [new HumanMessage(msg.content)];
// 	if (msg.role === "ai") return [new AIMessage(msg.content)];
// 	return [];
// });

// const response = await model.invoke([
// 	new SystemMessage(`
// 		You are a customer support agent chatting with a customer over text/chat.
// 		Never reveal you are an AI or a bot.

// 		LANGUAGE & DIALECT:
// 		- Detect the language and dialect the user writes in and respond in the EXACT same language and dialect.
// 		- Egyptian Arabic → Egyptian Arabic slang. Don't mix in formal Arabic.

// 		TONE:
// 		- Detect the user's emotional tone and respond accordingly.
// 		- Angry/frustrated → calm, apologetic, reassuring. Acknowledge the feeling first.
// 		- Happy → warm and match their energy.
// 		- Confused → patient and simple.

// 		STYLE — THIS IS CRITICAL:
// 		- You are texting, not writing an essay. Keep it SHORT and natural.
// 		- One or two sentences max unless the answer truly requires more.
// 		- No bullet points. No lists. No structured formatting.
// 		- Never start with greetings like "يا هلا" or "أهلاً" every single message.
// 		- Don't over-explain. Just answer and stop.
// 		- Don't add "أنا هنا لو محتاج حاجة تانية" or similar filler closings.
// 		- Sound like a real person texting a friend, not a call center script.

// 		ANSWER RULES:
// 		- Use the context below as your knowledge base. Never quote or reference it directly.
// 		- If the context doesn't have the answer, say so briefly and naturally in the user's language.
// 		- Do not make up information.
// 		- Remember User Issue and Personal Information that he provided to you during the conversation.
// 		- if the answer is not in the knowledge base then response with agentText: i don't know what are you talking about it's not in our knowledge base
// 		- Only answer greeting message, and when user say anything outside the context of the knowledge base then tell him it's out of our specifications and tell him to ask the question or the issue he want.

// 		Return JSON only, no markdown:
// 		{
// 			"agentText": string,
// 			"confidenceScore": number
// 		}

// 		Context:
// 		${context}
// 	`),
// 	...historyMessages,
// 	new HumanMessage(question),
// ]);

// const raw =
// 	typeof response.content === "string"
// 		? response.content
// 		: (response.content[0] as { text: string }).text;

// let parsed: { agentText: string; confidenceScore: number };

// try {
// 	const cleaned = raw.replace(/```json|```/g, "").trim();
// 	parsed = JSON.parse(cleaned);
// } catch {
// 	console.error("[RAG] Failed to parse model JSON response:", raw);
// 	parsed = { agentText: raw, confidenceScore: 0.5 };
// }

// const usage = response.usage_metadata as { total_tokens?: number } | undefined;

// return buildResponse(
// 	parsed.agentText,
// 	AgentAction.NO_MATCH,
// 	parsed.confidenceScore,
// 	usage?.total_tokens ?? 0,
// );
// }

export async function askTier0Agent({
	conversationId,
	organizationId,
	latestMessage,
	conversationHistory,
}: PipelineContext): Promise<TierResponse> {
	const questionVector = await queryEmbeddings.embedQuery(latestMessage);
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
	console.log(
		"[RAG] chunks found:",
		chunks.length,
		"for org:",
		organizationId,
	);

	if (chunks.length === 0) {
		return buildResponse(
			"Oh. about that thing. maybe you are talking about something else we don't have.",
			AgentAction.NO_MATCH,
			0,
			0,
		);
	}

	const context = chunks
		.map((chunk, i) => `[Source ${i + 1}]:\n${chunk.content}`)
		.join("\n\n");

	const historyMessages = conversationHistory.flatMap((msg): BaseMessage[] => {
		if (msg.role === "CUSTOMER") return [new HumanMessage(msg.content)];
		if (msg.role === "AI") return [new AIMessage(msg.content)];
		return [];
	});

	const response = await model.invoke([
		new SystemMessage(`
		You are a customer support agent chatting with a customer over text/chat.
Never reveal you are an AI or a bot.

TONE:
- Detect the user's emotional tone and respond accordingly.
- Angry/frustrated → calm, apologetic, reassuring. Acknowledge the feeling first.
- Happy → warm and match their energy.
- Confused → patient and simple.


ANSWER RULES:
- You will be given a pdf with styling elements, ignore everything just extract the chunkText
- Act as a helpful assistant and try to assist the customer as best as you can
- Use the context below as your knowledge base. Never quote or reference it directly.
- If the context doesn't have the answer or the message is out of scope/specifications, respond confidently by stating what you *can* help with related to your available services, keeping it brief and direct. 
- Do not make up information.
- Remember User Issue and Personal Information that he provided to you during the conversation.
- If the answer is easily found in the knowledge base don't escalate just respond
- Use the context below as your knowledge base. Never quote or reference it directly.
- If the context doesn't have the answer, say so briefly and naturally in the user's language.
- Do not make up information.
- Remember User Issue and Personal Information that he provided to you during the conversation.
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
		...historyMessages,
		new HumanMessage(latestMessage),
	]);

	const raw =
		typeof response.content === "string"
			? response.content
			: (response.content[0] as { text: string }).text;

	let parsed: { agentText: string; confidenceScore: number };

	try {
		const cleaned = raw.replace(/```json|```/g, "").trim();
		parsed = JSON.parse(cleaned);
	} catch {
		console.error("[RAG] Failed to parse model JSON response:", raw);
		parsed = { agentText: raw, confidenceScore: 0.5 };
	}

	const usage = response.usage_metadata as
		| { total_tokens?: number }
		| undefined;

	return buildResponse(
		parsed.agentText,
		AgentAction.NO_MATCH,
		parsed.confidenceScore,
		usage?.total_tokens ?? 0,
	);
}

function buildResponse(
	responseText: string,
	action: AgentAction,
	confidenceScore: number,
	tokensUsed: number,
) {
	return {
		responseText,
		action,
		tier: MessageTier.TIER0,
		agentLog: {
			tier: AgentTier.TIER0,
			confidenceScore,
			latencyMs: 0,
			tokensUsed,
		},
	};
}
