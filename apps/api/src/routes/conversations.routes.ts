import express, { Router } from "express";
import { authMiddleware } from "src/middlewares/auth.middleware.js";
import upload from "src/middlewares/upload.middleware.js";
import * as conversationsController from "../controllers/conversations.controller.js";
import * as csatController from "../controllers/csat.controller.js";
import { validateApiKey } from "src/middlewares/validateApiKey.middleware.js";
import { resolveCustomer } from "src/middlewares/resolveCustomer.middleware.js";
const router: Router = express.Router();

router.use(validateApiKey);
router.use(resolveCustomer);

router.post("/", conversationsController.startConversation);

// router.post("/:id/messages", conversationsController.sendMessage);

router.get("/:id/messages", conversationsController.getMessages);

router.post(
	"/:conversationId/csat",
	validateApiKey,
	resolveCustomer,
	csatController.submit,
);

export default router;
