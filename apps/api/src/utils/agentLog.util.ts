import prisma from "../config/prisma.js";
import type { AgentLogEntry } from "../types/agent.types.js";

export async function writeAgentLog(entry: AgentLogEntry): Promise<void> {
	await prisma.agentLog.create({
		data: {
			conversationId: entry.conversationId,
			tier: entry.tier,
			action: entry.action,
			input: entry.input,
			output: entry.output,
			confidenceScore: entry.confidenceScore ?? 0,
			latencyMs: entry.latencyMs,
			tokensUsed: entry.tokensUsed ?? 0,
		},
	});
}
