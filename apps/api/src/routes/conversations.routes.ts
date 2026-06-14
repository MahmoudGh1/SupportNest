import express, { Router } from "express";
import { authMiddleware } from "src/middlewares/auth.middleware.js";
import upload from "src/middlewares/upload.middleware.js";
import * as conversationsController from "../controllers/conversations.controller.js";
import { validateApiKey } from "src/middlewares/validateApiKey.middleware.js";
const router: Router = express.Router();

router.use(authMiddleware);
router.use(validateApiKey);

router.post("/", conversationsController.startConversation);

// router.post("/:id/messages", conversationsController.sendMessage);

router.get("/:id/messages", conversationsController.getMessages);

export default router;
