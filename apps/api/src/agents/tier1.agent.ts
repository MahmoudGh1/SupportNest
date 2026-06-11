import { AgentTier, MessageTier } from "generated/prisma/enums.js";
import type { PipelineContext, TierResponse } from "src/types/agent.types.js";

export async function askTier1Agent(
	context: PipelineContext,
): Promise<TierResponse> {
	return {
		tier: MessageTier.TIER1,
		responseText: "[Tier1 stub - API integration not implemented yet]",
		agentLog: {
			confidenceScore: 0.9,
			tokensUsed: 0,
		},
	};
}
