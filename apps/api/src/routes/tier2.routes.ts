import express, { type Router } from "express";
import { askTier2AgentController } from "../controllers/tier2.controller.js";

const tier2Router: Router = express.Router();

// POST /api/v1/tier2/ask
// Body: { question, organizationId, conversationId, history? }
// Called by: the router service when Tier 1 returns ESCALATED_TO_TIER2
tier2Router.post("/ask", askTier2AgentController);

export default tier2Router;