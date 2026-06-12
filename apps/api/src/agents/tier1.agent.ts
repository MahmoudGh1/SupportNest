import { AgentTier, MessageTier } from "generated/prisma/enums.js";
import { runTier1Agent } from "src/services/tier1.service.js";
import type { PipelineContext, TierResponse } from "src/types/agent.types.js";

export async function askTier1Agent(
	context: PipelineContext,
): Promise<TierResponse> {
	const result = await runTier1Agent(
		context.latestMessage,
		context.organizationId,
		context.conversationId,
		context.customerId,
		context.conversationHistory,
	);
	return {
		tier: result.tier,
		responseText: result.responseText,
		loginUrl: result.loginUrl,
		agentLog: {
			confidenceScore: result.agentLog.confidenceScore,
			tokensUsed: result.agentLog.tokensUsed,
		},
	};
}
