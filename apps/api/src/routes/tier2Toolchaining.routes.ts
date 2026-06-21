import express, { type Router } from "express";
import { askTier2ToolChainController } from "src/controllers/tier2Toolchaining.controller.js";

const tier2Router: Router = express.Router();


// POST /api/v1/tier2/toolchain
tier2Router.post("/toolchain", askTier2ToolChainController);

export default tier2Router;