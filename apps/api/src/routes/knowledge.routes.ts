import express, { Router } from "express";
import { authMiddleware } from "src/middlewares/auth.middleware.js";
import upload from "src/middlewares/upload.middleware.js";
import * as knowledgeController from "../controllers/knowledge.controller.js";
const router: Router = express.Router();

// router.post(
// 	"/organizations/:orgId/knowledge",
// 	// authMiddleware,
// 	upload.single("file"),
// 	knowledgeController.uploadDocument,
// );

router.get(
	"/organizations/:orgId/knowledge",
	// authMiddleware,
	knowledgeController.getKnowledgeDocuments,
);

router.delete(
	"/organizations/:orgId/knowledge/:docId",
	// authMiddleware,
	knowledgeController.deleteKnowledgeDocument,
);
export default router;
