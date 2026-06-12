import express, { Router } from "express";
import upload from "src/middlewares/upload.middleware.js";
import * as knowledgeController from "../controllers/knowledge.controller.js";
import { getMyOrgController, updateOrgProfileController, updateWidgetConfigController } from "src/controllers/organization.controller.js";
import { authMiddleware } from "src/middlewares/auth.middleware.js";
import { getActiveToolsForOrg, getAllToolsForOrg, getToolsByDocument, toggleTool } from "src/controllers/tool.controller.js";

const router: Router = express.Router();

router.use(authMiddleware);

router.get("/me", getMyOrgController);

router.patch("/me", updateOrgProfileController);

router.patch("/widget-config", updateWidgetConfigController);

router.post("/:orgId/documents/swagger", authMiddleware, knowledgeController.uploadSwaggerUrl);

router.get("/documents/:documentId/tools", authMiddleware, getToolsByDocument);

router.patch("/tools/:toolId/toggle", authMiddleware, toggleTool);

router.get("/tools/active", authMiddleware, getActiveToolsForOrg);

router.post("/:orgId/knowledge", authMiddleware, upload.single("file"), knowledgeController.uploadDocument);

router.get("/:orgId/knowledge", authMiddleware, knowledgeController.getKnowledgeDocuments);

router.delete("/:orgId/knowledge/:docId", authMiddleware, knowledgeController.deleteKnowledgeDocument);

router.get("/tools/all", authMiddleware, getAllToolsForOrg);

export default router;
