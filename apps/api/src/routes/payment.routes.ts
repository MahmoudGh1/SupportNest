import express, { Router } from "express";
import {
  completeCheckoutController,
  confirmPaymentController,
  createPaymentIntentionController,
  getPaymentHistoryController,
  handleWebhookController,
} from "src/controllers/payment.controller.js";
import { authMiddleware } from "src/middlewares/auth.middleware.js";

const router: Router = express.Router();
// Webhook — public, no auth (Paymob calls this)
router.post("/webhook", handleWebhookController);

// Protected routes
router.use(authMiddleware);

// role org_admin ==> requireRole('org_admin')
router.post("/create-intention", createPaymentIntentionController);
router.post("/complete", completeCheckoutController);
router.post("/confirm", confirmPaymentController);
router.get("/history", getPaymentHistoryController);

export default router;
