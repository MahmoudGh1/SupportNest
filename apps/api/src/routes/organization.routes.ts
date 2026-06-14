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

router.post("/:orgId/documents/swagger", knowledgeController.uploadSwaggerUrl);

router.get("/documents/:documentId/tools", getToolsByDocument);

router.patch("/tools/:toolId/toggle", toggleTool);

router.get("/tools/active", getActiveToolsForOrg);

router.post("/:orgId/knowledge", upload.single("file"), knowledgeController.uploadDocument);

router.get("/:orgId/knowledge", knowledgeController.getKnowledgeDocuments);

router.delete("/:orgId/knowledge/:docId", knowledgeController.deleteKnowledgeDocument);

router.get("/tools/all", getAllToolsForOrg);

export default router;
