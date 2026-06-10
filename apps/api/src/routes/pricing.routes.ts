import express, { Router } from "express";
import { getActivePlans } from "src/controllers/pricing.controller.js";

const router: Router = express.Router();

// Public — no auth needed, anyone can see plans
router.get("/", getActivePlans);

export default router;
