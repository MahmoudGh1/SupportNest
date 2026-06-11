import { AgentTier, MessageTier } from "generated/prisma/enums.js";
import type { PipelineContext, TierResponse } from "src/types/agent.types.js";

export async function askTier2Agent(
	context: PipelineContext,
): Promise<TierResponse> {
	return {
		tier: MessageTier.TIER2,
		responseText: "[Tier2 stub - complex troubleshooting not implemented yet]",
		agentLog: {
			confidenceScore: 0.9,
			tokensUsed: 0,
		},
	};
}
