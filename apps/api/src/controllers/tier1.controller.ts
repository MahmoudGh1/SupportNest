import type { Request, Response } from "express";
import { runTier1Agent } from "../services/tier1.service.js";
import { loadMemory } from "../utils/conversationMemory.utils.js";

export async function tier1AgentController(
  req: Request,
  res: Response,
): Promise<void> {
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
    // Load conversation memory from Redis — same pattern as Tier 0
    const conversationHistory = await loadMemory(conversationId);

    const result = await runTier1Agent(
      question.trim(),
      organizationId,
      conversationId,
      customerId,
      conversationHistory,
    );

    res.status(200).json(result);
  } catch (err) {
    console.error("[Tier1 Controller Error]:", err);
    res.status(500).json({
      message: "Internal Server Error",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
