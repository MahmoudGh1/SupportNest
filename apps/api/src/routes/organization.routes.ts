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

router.post("/:organizationId/documents/swagger", knowledgeController.uploadSwaggerUrl);

router.get("/documents/:documentId/tools", getToolsByDocument);

router.patch("/tools/:toolId/toggle", toggleTool);

router.get("/tools/active", getActiveToolsForOrg);

router.post("/:organizationId/knowledge", upload.single("file"), knowledgeController.uploadDocument);

router.get("/:organizationId/knowledge", knowledgeController.getKnowledgeDocuments);

router.delete("/:organizationId/knowledge/:docId", knowledgeController.deleteKnowledgeDocument);

router.get("/tools/all", getAllToolsForOrg);

export default router;
