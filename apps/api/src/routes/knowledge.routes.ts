import express, { Router } from "express";
import { authMiddleware } from "src/middlewares/auth.middleware.js";
import upload from "src/middlewares/upload.middleware.js";
import * as knowledgeController from "../controllers/knowledge.controller.js";
import {
	getActiveToolsForOrg,
	getToolsByDocument,
	toggleTool,
} from "src/controllers/tool.controller.js";
const router: Router = express.Router();

// router.post("/organizations/:orgId/knowledge", authMiddleware, upload.single("file"), knowledgeController.uploadDocument);

// router.get("/organizations/:orgId/knowledge", authMiddleware, knowledgeController.getKnowledgeDocuments);

// router.delete("/organizations/:orgId/knowledge/:docId", authMiddleware, knowledgeController.deleteKnowledgeDocument);
router.post(
	"/knowledge",
	authMiddleware,
	upload.single("file"),
	knowledgeController.uploadDocument,
);

router.get(
	"/knowledge",
	authMiddleware,
	knowledgeController.getKnowledgeDocuments,
);

router.delete(
	"/knowledge/:docId",
	authMiddleware,
	knowledgeController.deleteKnowledgeDocument,
);

router.post(
	"/documents/swagger",
	authMiddleware,
	knowledgeController.uploadSwaggerUrl,
);

router.get("/documents/:documentId/tools", authMiddleware, getToolsByDocument);

router.patch("/tools/:toolId/toggle", authMiddleware, toggleTool);

router.get("/tools/active", authMiddleware, getActiveToolsForOrg);

export default router;
