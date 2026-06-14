import type { Response, RequestHandler } from "express";
import type { AuthenticatedRequest } from "../types/auth.types.js";
import { sendInvitationService, validateInvitationService, acceptInvitationService, getTeamService, revokeInvitationService } from "../services/invitation.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";

export const sendInvitationController: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
	const organizationId = req.user?.organizationId;
	const invitedById = req.user?.sub;
	const { email } = req.body;

	if (!email || typeof email !== "string") {
		throw new AppError("A valid email is required", 400);
	}
	if (!organizationId || !invitedById) {
		throw new AppError("Unauthorized", 401);
	}

	await sendInvitationService(organizationId, invitedById, email.toLowerCase().trim());

	res.status(200).json({ message: "Invitation sent successfully" });
});

export const validateInvitationController: RequestHandler = asyncHandler(async (req, res) => {
	const { token } = req.params;
	const result = await validateInvitationService(token);
	res.status(200).json(result);
});

export const acceptInvitationController: RequestHandler = asyncHandler(async (req, res) => {
	const { token } = req.params;
	const { firstName, lastName, password } = req.body;

	if (!firstName || !lastName || !password) {
		throw new AppError("firstName, lastName and password are required", 400);
	}
	if (password.length < 8) {
		throw new AppError("Password must be at least 8 characters", 400);
	}

	const result = await acceptInvitationService(token, firstName, lastName, password);
	res.status(201).json(result);
});

export const getTeamController: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
	const organizationId = req.user?.organizationId;
	if (!organizationId) throw new AppError("Unauthorized", 401);

	const result = await getTeamService(organizationId);
	res.status(200).json(result);
});

export const revokeInvitationController: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
	const organizationId = req.user?.organizationId;
	const { id } = req.params;

	if (!organizationId) throw new AppError("Unauthorized", 401);

	await revokeInvitationService(id, organizationId);
	res.status(200).json({ message: "Invitation revoked" });
});
