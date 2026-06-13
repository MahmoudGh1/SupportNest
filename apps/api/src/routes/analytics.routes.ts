import express, { Router } from "express";
import { authMiddleware } from "src/middlewares/auth.middleware.js";
import * as analyticsController from "src/controllers/analytics.controller.js";
import { adminMiddleware } from "src/middlewares/admin.middleware.js";
import { Role } from "generated/prisma/enums.js";
import asyncHandler from "src/utils/asyncHandler.js";

const router: Router = express.Router();

router.get(
	"/summary?range=7d",
	authMiddleware,
	adminMiddleware(Role.ORG_ADMIN),
	analyticsController.summary,
);

export default router;
