import express, { type Router } from "express";
import { askTier0AgentController } from "../controllers/rag.controller.js";
import { authMiddleware } from "src/middlewares/auth.middleware.js";

const ragRouter: Router = express.Router();

ragRouter.post("/ask", authMiddleware, askTier0AgentController);

export default ragRouter;
