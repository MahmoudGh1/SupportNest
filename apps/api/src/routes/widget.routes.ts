import express, { Router } from "express";
import { verifyCustomerController } from "src/controllers/customer-verify.controller.js";
import { widgetInitController } from "src/controllers/widget.controller.js";

const router: Router = express.Router();

// Public — only needs API key (handled inside service)
router.post("/init", widgetInitController);

router.post("/sessions/:conversationId/verify", verifyCustomerController);
export default router;
