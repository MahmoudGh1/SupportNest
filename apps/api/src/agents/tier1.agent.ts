import { AgentTier, MessageTier } from "generated/prisma/enums.js";
import { runTier1Agent } from "src/services/tier1.service.js";
import type { PipelineContext, TierResponse } from "src/types/agent.types.js";

// export async function askTier1Agent(
// 	context: PipelineContext,
// ): Promise<TierResponse> {
// 	const result = await runTier1Agent(context);
// 	return {
// 		tier: result.tier,
// 		responseText: result.responseText,
// 		loginUrl: result.loginUrl as string,
// 		agentLog: {
// 			confidenceScore: result.agentLog.confidenceScore,
// 			tokensUsed: result.agentLog.tokensUsed as number,
// 		},
// 	};
// }
// export async function askTier1Agent(
// 	context: PipelineContext,
// ): Promise<TierResponse> {
// 	return {
// 		tier: MessageTier.TIER2,
// 		responseText: "[Tier1 stub - complex troubleshooting not implemented yet]",
// 		agentLog: {
// 			confidenceScore: 0.9,
// 			tokensUsed: 0,
// 		},
// 	};
// }


export async function askTier1Agent(
	context: PipelineContext,
): Promise<TierResponse> {
	return await runTier1Agent(context)
};