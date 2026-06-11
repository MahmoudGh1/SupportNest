import express, { Router } from "express";
import upload from "src/middlewares/upload.middleware.js";
import * as knowledgeController from "../controllers/knowledge.controller.js";
import {
	getMyOrgController,
	updateOrgProfileController,
	updateWidgetConfigController,
} from "src/controllers/organization.controller.js";
import { authMiddleware } from "src/middlewares/auth.middleware.js";

const router: Router = express.Router();

// All org routes require logged in org admin
router.use(authMiddleware);
// router.use(requireRole('org_admin', 'support_agent'));

// GET  /organizations/me          → get org details + widgetConfig
// GET  /organizations/me/stats    → dashboard home stats
// PATCH /organizations/me         → update name or email
// PATCH /organizations/widget-config → update widget appearance

router.get("/me", getMyOrgController);
// router.get('/me/stats', getOrgStats);

// Only org_admin can update
// router.patch('/me', requireRole('org_admin'), updateOrgProfileController);
// router.patch('/widget-config', requireRole('org_admin'), updateWidgetConfigController);

router.patch("/me", updateOrgProfileController);
router.patch("/widget-config", updateWidgetConfigController);

/* ------------------------------ */
/* ----Knowledge Base Routes----- */
/* ------------------------------ */
router.post(
	"/:orgId/knowledge",
	authMiddleware,
	upload.single("file"),
	knowledgeController.uploadDocument,
);

router.get(
	"/:orgId/knowledge",
	// authMiddleware,
	knowledgeController.getKnowledgeDocuments,
);

router.delete(
	"/:orgId/knowledge/:docId",
	// authMiddleware,
	knowledgeController.deleteKnowledgeDocument,
);
export default router;
