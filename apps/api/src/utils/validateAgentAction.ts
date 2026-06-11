// Define your allowed actions as a constant for easy access
const ALLOWED_ACTIONS = [
	"RESOLVED",
	"ESCALATED_TO_TIER1",
	"ESCALATED_TO_TIER2",
	"ESCALATED_TO_HUMAN",
	"REJECTED_OUTPUT",
	"NO_MATCH",
] as const;

type AgentAction = (typeof ALLOWED_ACTIONS)[number];

export default function validateAgentAction(decision: string): AgentAction {
	const formattedAction = `ESCALATED_TO_${decision}` as any;

	// Check if it exists in your allowed list
	if (ALLOWED_ACTIONS.includes(formattedAction)) {
		return formattedAction;
	}

	// Fallback: If the LLM gives you something invalid (like TIER0),
	// log it as NO_MATCH or another safe default
	console.warn(
		`Unexpected routing decision from LLM: ${decision}. Defaulting to NO_MATCH.`,
	);
	return "NO_MATCH";
}
