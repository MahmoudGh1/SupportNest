import { AgentAction, AgentTier, ResolutionTier } from "generated/prisma/enums.js";
import { buildReviewPrompt, buildRoutingPrompt } from "src/agents/prompts/router.prompt.js";
import { fastModel, model } from "src/config/langChain.js";
import { askTier0Agent } from "src/services/rag.service.js";
import type { PipelineContext, RouterOutput, TierResponse } from "src/types/agent.types.js";
import { writeAgentLog } from "src/utils/agentLog.util.js";
import { Router } from "express";
import { askTier1Agent } from "src/agents/tier1.agent.js";
import { askTier2Agent } from "src/agents/tier2.agent.js";
import { validateReviewDecision, validateRoutingDecision } from "src/utils/validateAgentAction.js";

// helper - call the llm and parse the json response
async function callRouterLLM(prompt: string): Promise<{ parsed: any; tokensUsed: number }> {
	const response = await fastModel.invoke([{ role: "user", content: prompt }]);

	const rawText = typeof response.content === "string" ? response.content : Array.isArray(response.content) ? response.content.map((c: any) => c.text ?? "").join("") : "";

	const cleanedText = rawText.replace(/```json\s*|```/g, "").trim();

	try {
		return {
			parsed: JSON.parse(cleanedText),
			tokensUsed: (response.usage_metadata as any)?.total_tokens ?? 0,
		};
	} catch (error) {
		throw new Error(`Model returned invalid JSON:\n${cleanedText}`);
	}
}

// helper - call the right tier based on routing decision
async function callTier(decision: AgentTier, context: PipelineContext): Promise<TierResponse> {
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
function getNextTier(current: AgentTier): Exclude<AgentTier, "ROUTER" | "TIER0"> | "HUMAN" {
	if (current === "TIER0") return "TIER1";
	if (current === "TIER1") return "TIER2";
	return "HUMAN";
}

export async function runRouter(context: PipelineContext): Promise<RouterOutput> {
	const { conversationId, latestMessage, conversationHistory, organizationId } = context;

	// --- phase 1: routing decision

	const routingPrompt = buildRoutingPrompt(latestMessage, conversationHistory);

	const routingStart = Date.now();

	const { parsed: routingResult, tokensUsed: routingTokens } = await callRouterLLM(routingPrompt);
	console.log("Routing Result: ", routingResult);
	const routingLatency = Date.now() - routingStart;
	console.log("Latency: ", routingLatency);
	const routingDecision = routingResult.routingDecision as Exclude<AgentTier, "ROUTER"> | "HUMAN";
	console.log("Routing decision value:", routingDecision);

	// Log the routing decision
	const validatedRoutingDecision = validateRoutingDecision(routingDecision);
	console.log(validateRoutingDecision);
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
			finalResponse: "I am connecting you with a human agent who will assist you shortly.",
			resolvedByTier: ResolutionTier.HUMAN,
			approved: true,
		};
	}

	console.log(validatedRoutingDecision);
	// -- phase 2: tier call + review loop

	let currentTier = routingDecision as Exclude<Exclude<AgentTier, "ROUTER">, "HUMAN">;
	const MAX_ATTEMPTS = 3; // tier0 -> tier1 -> tier2 -> human
	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
		// Call the current tier

		const tierStart = Date.now();
		const tierResponse: TierResponse = await callTier(currentTier, context);
		console.log(`${currentTier} Response:`, tierResponse);

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
		const reviewPrompt = buildReviewPrompt(latestMessage, tierResponse.responseText, currentTier, toolResultsSummary);


		const reviewStart = Date.now();

		const { parsed: reviewResult, tokensUsed: reviewTokens } = await callRouterLLM(reviewPrompt);

		console.log(reviewResult);

		const reviewLatency = Date.now() - reviewStart;

		const verdict = reviewResult.reviewVerdict as "approved" | "rejected";

		const reviewDecision = verdict === "approved" ? AgentAction.RESOLVED : AgentAction.REJECTED_OUTPUT;

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
				finalResponse: "I am connecting you with a human agent who will assist you shortly.",
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
		finalResponse: "I am connecting you with a human agent who will assist you shortly.",
		resolvedByTier: ResolutionTier.HUMAN,
		approved: true,
	};
}
