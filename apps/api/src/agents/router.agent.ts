import {
	AgentAction,
	AgentTier,
	ResolutionTier,
} from "generated/prisma/enums.js";
import {
	buildReviewPrompt,
	buildRoutingPrompt,
} from "src/agents/prompts/router.prompt.js";
import { fastModel, model } from "src/config/langChain.js";
import { askTier0Agent } from "src/services/rag.service.js";
import type {
	PipelineContext,
	RouterOutput,
	TierResponse,
} from "src/types/agent.types.js";
import { writeAgentLog } from "src/utils/agentLog.util.js";
import { Router } from "express";
import { askTier1Agent } from "src/agents/tier1.agent.js";
import { askTier2Agent } from "src/agents/tier2.agent.js";
import {
	validateReviewDecision,
	validateRoutingDecision,
} from "src/utils/validateAgentAction.js";

function normalizeMessage(message: string): string {
	return (
		message
			.trim()
			.toLowerCase()
			// strip Arabic diacritics (tashkeel)
			.replace(/[\u064B-\u065F\u0670]/g, "")
			// strip Arabic elongation marks (tatweel), e.g. "مرحبـــا"
			.replace(/\u0640/g, "")
			// normalize Arabic letter variants
			.replace(/[إأآا]/g, "ا")
			.replace(/ى/g, "ي")
			.replace(/ة/g, "ه")
			// strip trailing punctuation (Latin + Arabic) and collapse whitespace
			.replace(/[!.,؟،؛]+$/g, "")
			.replace(/\s+/g, " ")
			.trim()
	);
}

const SMALL_TALK_PATTERNS: { pattern: RegExp; reply: string }[] = [
	// Greetings
	{
		pattern: /^(hi+|hey+|hello+|yo|sup|good (morning|afternoon|evening))$/,
		reply: "Hi there! How can I help you today?",
	},
	{
		pattern:
			/^(السلام عليكم|سلام|اهلا|اهلين|مرحبا|هاي|هلا|صباح الخير|مساء الخير)$/,
		reply: "أهلاً! كيف يمكنني مساعدتك اليوم؟",
	},

	// Thanks
	{
		pattern:
			/^(thanks?( you)?|thank you( so much| very much)?|thx|ty|appreciate it)$/,
		reply:
			"You're welcome! Let me know if there's anything else I can help with.",
	},
	{
		pattern: /^(شكرا|متشكر|تشكرات|تسلم|يعطيك العافيه)$/,
		reply: "العفو! قول لي لو احتجت أي مساعدة تانية.",
	},

	// Acknowledgement
	{
		pattern: /^(ok|okay|alright|got it|sounds good|cool|great|perfect)$/,
		reply:
			"Glad that helps! Let me know if there's anything else I can do for you.",
	},
	{
		pattern: /^(تمام|اوك|أوكي|ماشي|حلو)$/,
		reply: "تمام! أنا موجود لو احتجت أي شيء تاني.",
	},

	// Farewell
	{
		pattern:
			/^(bye|goodbye|see you|see ya|later|have a (good|nice) (day|one))$/,
		reply: "Take care! Feel free to reach out anytime you need help.",
	},
	{
		pattern: /^(باي|مع السلامه|الى اللقاء|تصبح على خير|تصبحي على خير)$/,
		reply: "مع السلامة! تواصل معنا في أي وقت تحتاج مساعدة.",
	},
];

function detectSmallTalk(message: string): string | null {
	const normalized = normalizeMessage(message);

	for (const { pattern, reply } of SMALL_TALK_PATTERNS) {
		if (pattern.test(normalized)) {
			return reply;
		}
	}

	return null;
}

// helper - call the llm and parse the json response
async function callRouterLLM(
	prompt: string,
	retries = 1,
): Promise<{ parsed: any; tokensUsed: number }> {
	const response = await fastModel.invoke([{ role: "user", content: prompt }]);

	const rawText =
		typeof response.content === "string"
			? response.content
			: Array.isArray(response.content)
				? response.content.map((c: any) => c.text ?? "").join("")
				: "";

	const tokensUsed = (response.usage_metadata as any)?.total_tokens ?? 0;

	let cleanedText = rawText.replace(/```json\s*|```/g, "").trim();

	// Extract the JSON object even if surrounded by extra text
	const firstBrace = cleanedText.indexOf("{");
	const lastBrace = cleanedText.lastIndexOf("}");
	if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
		cleanedText = cleanedText.slice(firstBrace, lastBrace + 1);
	}

	try {
		return { parsed: JSON.parse(cleanedText), tokensUsed };
	} catch (error) {
		console.error("Router LLM returned invalid JSON. Raw response:", rawText);

		if (retries > 0) {
			const retryPrompt = `${prompt}\n\nYour previous response was not valid JSON. Respond again with ONLY the JSON object, nothing else.`;
			return callRouterLLM(retryPrompt, retries - 1);
		}

		throw new Error(`Model returned invalid JSON:\n${cleanedText}`);
	}
}

// helper - call the right tier based on routing decision
async function callTier(
	decision: AgentTier,
	context: PipelineContext,
): Promise<TierResponse> {
	switch (decision) {
		case "TIER0":
			return await askTier0Agent(context);
		case "TIER1":
			return await askTier1Agent(context);
		case "TIER2":
			return await askTier2Agent(context);
	}
	return {
		tier: "TIER0",
		responseText: "hello",
		agentLog: {
			confidenceScore: 8,
			tokensUsed: 250,
		},
	};
}

// helper - get the next tier up in the escalation ladder
function getNextTier(
	current: AgentTier,
): Exclude<AgentTier, "ROUTER" | "TIER0"> | "HUMAN" {
	if (current === "TIER0") return "TIER1";
	if (current === "TIER1") return "TIER2";
	return "HUMAN";
}

export async function runRouter(
	context: PipelineContext,
): Promise<RouterOutput> {
	const {
		conversationId,
		latestMessage,
		conversationHistory,
		organizationId,
	} = context;
	// --- phase 0: cheap small-talk pre-filter (no LLM call)
	const smallTalkReply = detectSmallTalk(latestMessage);

	if (smallTalkReply) {
		await writeAgentLog({
			conversationId,
			tier: AgentTier.ROUTER,
			action: AgentAction.RESOLVED,
			input: latestMessage,
			output: "Matched small talk pattern, responded without invoking any LLM",
			latencyMs: 0,
			tokensUsed: 0,
		});

		return {
			finalResponse: smallTalkReply,
			resolvedByTier: ResolutionTier.TIER0,
			approved: true,
		};
	}

	// --- phase 1: routing decision

	const routingPrompt = buildRoutingPrompt(latestMessage, conversationHistory);
	// console.log(routingPrompt);
	const routingStart = Date.now();

	let routingResult: any;
	let routingTokens = 0;

	try {
		const result = await callRouterLLM(routingPrompt);
		routingResult = result.parsed;
		routingTokens = result.tokensUsed;
	} catch (error) {
		console.error("Router LLM failed after retries:", error);

		await writeAgentLog({
			conversationId,
			tier: AgentTier.ROUTER,
			action: AgentAction.NO_MATCH,
			input: latestMessage,
			output: `Router LLM failed after retries: ${(error as Error).message}`,
			latencyMs: Date.now() - routingStart,
			tokensUsed: 0,
		});

		routingResult = {
			routingDecision: "TIER0",
			routingReason:
				"Fallback default — router LLM failed to return valid JSON",
		};
	}

	// Short-circuit - small talk handled directly by the router, no tier needed
	if (routingResult.smallTalkReply) {
		await writeAgentLog({
			conversationId,
			tier: AgentTier.ROUTER,
			action: AgentAction.RESOLVED,
			input: latestMessage,
			output: "Handled as small talk, no tier invoked",
			latencyMs: 0,
			tokensUsed: 0,
		});
		console.log(routingResult);
		return {
			finalResponse: routingResult.smallTalkReply,
			resolvedByTier: ResolutionTier.TIER0,
			approved: true,
		};
	}

	const routingLatency = Date.now() - routingStart;
	const routingDecision = routingResult.routingDecision as
		| Exclude<AgentTier, "ROUTER">
		| "HUMAN";

	console.log("routing results", routingResult);
	// console.log("Routing decision value:", routingDecision);

	// Log the routing decision
	const validatedRoutingDecision = validateRoutingDecision(routingDecision);
	await writeAgentLog({
		conversationId,
		tier: AgentTier.ROUTER,
		action: validatedRoutingDecision as AgentAction,
		input: latestMessage,
		output: routingResult.routingReason,
		latencyMs: routingLatency,
		tokensUsed: routingTokens,
	});

	// Short-circuit - go straight to human, no tier involved
	if (validatedRoutingDecision === "ESCALATED_TO_HUMAN") {
		return {
			finalResponse:
				"I am connecting you with a human agent who will assist you shortly.",
			resolvedByTier: ResolutionTier.HUMAN,
			approved: true,
		};
	}

	console.log(validatedRoutingDecision);
	// -- phase 2: tier call + review loop

	let currentTier = routingDecision as Exclude<
		Exclude<AgentTier, "ROUTER">,
		"HUMAN"
	>;
	const MAX_ATTEMPTS = 3; // tier0 -> tier1 -> tier2 -> human
	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
		// Call the current tier

		const tierStart = Date.now();
		const tierResponse: TierResponse = await callTier(currentTier, context);
		console.log(tierResponse);
		// short-circuit: customer needs to authenticate first
		if ((tierResponse as any).loginUrl) {
			return {
				finalResponse: tierResponse.responseText,
				resolvedByTier: ResolutionTier.HUMAN,
				approved: true,
				loginUrl: tierResponse.loginUrl as string | null,
			};
		}

		const tierLatency = Date.now() - tierStart;

		// -- phase 3: Review Decision

		const toolResultsSummary = tierResponse.toolResults?.join("\n\n");
		const reviewPrompt = buildReviewPrompt(
			latestMessage,
			tierResponse.responseText,
			currentTier,
			toolResultsSummary,
		);

		const reviewStart = Date.now();

		const { parsed: reviewResult, tokensUsed: reviewTokens } =
			await callRouterLLM(reviewPrompt);

		console.log(reviewResult);

		const reviewLatency = Date.now() - reviewStart;

		const verdict = reviewResult.reviewVerdict as "approved" | "rejected";

		const reviewDecision =
			verdict === "approved"
				? AgentAction.RESOLVED
				: AgentAction.REJECTED_OUTPUT;

		console.log("review result", reviewResult);
		// Log the review decision
		const validatedReviewDecision = validateReviewDecision(reviewDecision);
		await writeAgentLog({
			conversationId,
			tier: AgentTier.ROUTER,
			action: validatedReviewDecision as AgentAction,
			input: tierResponse.responseText,
			output: reviewResult.reviewReason,
			confidenceScore: tierResponse.agentLog.confidenceScore,
			latencyMs: reviewLatency,
			tokensUsed: reviewTokens,
		});

		// -- Approved: return the response
		if (verdict === "approved") {
			return {
				finalResponse: tierResponse.responseText,
				resolvedByTier: currentTier,
				approved: true,
			};
		}

		// -- Rejected: escalate to next tier
		const next = getNextTier(currentTier);

		if (next === "HUMAN") {
			// Exhausted all tiers - go to human
			await writeAgentLog({
				conversationId,
				tier: AgentTier.ROUTER,
				action: AgentAction.ESCALATED_TO_HUMAN,
				input: latestMessage,
				output: `All tiers exhausted. Last rejection reason: ${reviewResult.reviewReason}`,
				latencyMs: 0,
				tokensUsed: 0,
			});

			return {
				finalResponse:
					"I am connecting you with a human agent who will assist you shortly.",
				resolvedByTier: ResolutionTier.HUMAN,
				approved: true,
			};
		}
		const escalationActionMap = {
			TIER1: AgentAction.ESCALATED_TO_TIER1,
			TIER2: AgentAction.ESCALATED_TO_TIER2,
			HUMAN: AgentAction.ESCALATED_TO_HUMAN,
		};

		// Log the escalation to next tier
		await writeAgentLog({
			conversationId,
			tier: AgentTier.ROUTER,
			action: escalationActionMap[next] as AgentAction,
			input: latestMessage,
			output: `Escalating from ${currentTier} to ${next}. Rejection reason: ${reviewResult.reviewReason}`,
			latencyMs: 0,
			tokensUsed: 0,
		});

		currentTier = next;
	}

	// Fallback - should never reach here (just needed for typescript)
	return {
		finalResponse:
			"I am connecting you with a human agent who will assist you shortly.",
		resolvedByTier: ResolutionTier.HUMAN,
		approved: true,
	};
}
