import express, { Router } from "express";
import { apiKeyController, listApiKeysController, revokeApiKeyController } from "src/controllers/apiKey.controller.js";
import { authMiddleware } from "src/middlewares/auth.middleware.js";

/**
 * API Key routes for organization-scoped key creation, listing, and revocation.
 */
const router: Router = express.Router();

router.use(authMiddleware);
// router.use()  role org_admin only

/**
 * Creates a new API key for the authenticated organization.
 */
router.post("/create", apiKeyController);

/**
 * Lists all API keys for the authenticated organization.
 */
router.get("/keys", listApiKeysController);

/**
 * Revokes a specific API key belonging to the authenticated organization.
 */
router.patch("/:id/revoke", revokeApiKeyController);

export default router;
