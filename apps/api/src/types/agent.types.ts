import type {
	AgentAction,
	AgentTier,
	MessageTier,
} from "generated/prisma/enums.js";

// what tier to route to, and the router's reasoning
export type RoutingDecision = {
	tier: "TIER0" | "TIER1" | "TIER2" | "HUMAN";
	reason: string;
};

// What the router decides after reviewing a tier's response
export type ReviewDecision = {
	verdict: "approved" | "rejected";
	reason: string;
};

// The raw JSON the router LLM returns — both decisions in one call
export type RouterLLMOutput = {
	routingDecision: "TIER0" | "TIER1" | "TIER2" | "HUMAN";
	routingReason: string;
	reviewVerdict: "approved" | "rejected";
	reviewReason: string;
};

// the standard shape every tier returns back to the router (content, confidence score, tier name)
export type TierResponse = {
	tier: MessageTier;
	responseText: string;
	agentLog: {
		confidenceScore: number; // 0.0 - 1.0
		tokensUsed?: number;
	};
};

// A single message in the conversation history passed to the router
export type ConversationMessage = {
	role: "CUSTOMER" | "AI" | "HUMAN_AGENT";
	content: string;
	tier?: "TIER0" | "TIER1" | "TIER2" | null;
	createdAt: Date;
};

// Everything the router (and tiers) receive to do their job
export type PipelineContext = {
	conversationId: string;
	organizationId: string;
	latestMessage: string;
	conversationHistory: ConversationMessage[];
};

// What the router returns after the full cycle (routing + tier call + review)
export type RouterOutput = {
	finalResponse: string;
	resolvedByTier: Exclude<AgentTier, "ROUTER"> | "HUMAN";
	approved: boolean;
};

// What gets written to agent_logs — maps directly to your Prisma schema
export type AgentLogEntry = {
	conversationId: string;
	tier: AgentTier;
	action: string;
	input: string;
	output: string;
	confidenceScore?: number;
	latencyMs: number;
	tokensUsed?: number;
};
