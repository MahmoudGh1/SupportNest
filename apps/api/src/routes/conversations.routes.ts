import express, { Router } from "express";
import { authMiddleware } from "src/middlewares/auth.middleware.js";
import upload from "src/middlewares/upload.middleware.js";
import * as conversationsController from "../controllers/conversations.controller.js";
const router: Router = express.Router();

router.use("/widget");

router.post(
	"/conversations",
	// authMiddleware,
	conversationsController.startConversationController,
);
export default router;
