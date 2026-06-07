import type { Request, Response } from "express";
import { askTier0Agent } from "../services/rag.service.js";

export async function askTier0AgentController(req: Request, res: Response): Promise<void> {
	const { question, organizationId } = req.body;

	if (!question || typeof question !== "string" || question.trim() === "") {
		res.status(400).json({ message: "question is required." });
		return;
	}

	if (!organizationId || typeof organizationId !== "string") {
		res.status(400).json({ message: "organizationId is required." });
		return;
	}

	try {
		const answer = await askTier0Agent(question.trim(), organizationId);
		res.status(200).json(answer);
	} catch (err) {
		console.error("RAG Controller Error:", err);
		res.status(500).json({
			message: "Internal Server Error",
			error: err instanceof Error ? err.message : "Unknown error",
		});
	}
}
