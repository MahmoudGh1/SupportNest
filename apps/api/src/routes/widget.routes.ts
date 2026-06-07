import express, { Router } from "express";
import { widgetInitController } from "src/controllers/widget.controller.js";

const router: Router = express.Router();

// Public — only needs API key (handled inside service)
router.post("/init", widgetInitController);

export default router;
