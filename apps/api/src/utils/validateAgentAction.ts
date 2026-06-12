const TIER_ACTIONS = [
	"ESCALATED_TO_TIER0",
	"ESCALATED_TO_TIER1",
	"ESCALATED_TO_TIER2",
	"ESCALATED_TO_HUMAN",
] as const;

const REVIEW_ACTIONS = ["RESOLVED", "REJECTED_OUTPUT"] as const;

type TierAction = (typeof TIER_ACTIONS)[number];
type ReviewAction = (typeof REVIEW_ACTIONS)[number];

export function validateRoutingDecision(decision: string): TierAction {
	const formatted = `ESCALATED_TO_${decision.toUpperCase()}` as any;
	if (TIER_ACTIONS.includes(formatted)) return formatted;
	console.warn(
		`Unexpected routing decision from LLM: ${decision}. Defaulting to ESCALATED_TO_HUMAN.`,
	);
	return "ESCALATED_TO_HUMAN";
}

export function validateReviewDecision(verdict: string): ReviewAction {
	const formatted = verdict.toUpperCase() as any;
	if (REVIEW_ACTIONS.includes(formatted)) return formatted;
	console.warn(
		`Unexpected review verdict from LLM: ${verdict}. Defaulting to REJECTED_OUTPUT.`,
	);
	return "REJECTED_OUTPUT";
}
