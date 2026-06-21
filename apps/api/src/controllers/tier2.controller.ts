import type { Request, Response } from "express";
import { askTier2Agent } from "../services/tier2.service.js";

export async function askTier2AgentController(req: Request, res: Response): Promise<void> {
	const { question, organizationId, conversationId, history } = req.body;

	// ── Validation ──────────────────────────────────────────────────────────────
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

	// history is optional — default to empty array
	const conversationHistory = Array.isArray(history) ? history : [];

	try {
		const answer = await askTier2Agent({
			question: question.trim(),
			organizationId,
			conversationId,
			history: conversationHistory,
		});

		res.status(200).json(answer);
	} catch (err) {
		console.error("[Tier2 Controller Error]:", err);
		res.status(500).json({
			message: "Internal Server Error",
			error: err instanceof Error ? err.message : "Unknown error",
		});
	}
}
