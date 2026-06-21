import type { Request, Response } from "express";
import { runTier2ToolChainAgent } from "../services/tier2ToolChain.service.js";
import { loadMemory } from "../utils/conversationMemory.utils.js";
import type { PipelineContext } from "src/types/agent.types.js";


export async function askTier2ToolChainController(req: Request, res: Response): Promise<void> {
	const { question, organizationId, conversationId, customerId } = req.body;

	if (!question || typeof question !== "string" || question.trim() === "") {
		res.status(400).json({ message: "question is required." });
		return;
	}
	if (!organizationId || typeof organizationId !== "string") {
		res.status(400).json({ message: "organizationId is required." });
		return;
	}
	if (!conversationId || typeof conversationId !== "string") {
		res.status(400).json({ message: "conversationId is required." });
		return;
	}
	if (!customerId || typeof customerId !== "string") {
		res.status(400).json({ message: "customerId is required." });
		return;
	}

	try {
		const conversationHistory = await loadMemory(conversationId);

		const context: PipelineContext = {
			conversationId,
			organizationId,
			customerId,
			latestMessage: question.trim(),
			conversationHistory,
			priorTierContext: null,
		};

		const result = await runTier2ToolChainAgent(context);
		console.log("Result is:", result)

		res.status(200).json(result);
	} catch (err) {
		console.error("[Tier2 ToolChain Controller Error]:", err);
		res.status(500).json({
			message: "Internal Server Error",
			error: err instanceof Error ? err.message : "Unknown error",
		});
	}
}