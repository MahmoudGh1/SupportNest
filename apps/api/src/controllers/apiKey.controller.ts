import type { Response, RequestHandler } from "express";
import {
	createApiKeyService,
	listApiKeysService,
	revokeApiKeyService,
} from "src/services/apiKey.service.js";
import type { AuthenticatedRequest } from "src/types/auth.types.js";
import AppError from "src/utils/appError.js";

/**
 * Creates a new API key for the authenticated user's organization.
 *
 * @param req - Authenticated request with allowedOrigins in body.
 * @param res - Express response object.
 * @returns The generated API secret.
 */
export const apiKeyController: RequestHandler = async (
	req: AuthenticatedRequest,
	res: Response,
) => {
	try {
		const { allowedOrigins = [] } = req.body;
		const organizationId = req.user?.organizationId;

		if (!organizationId) {
			throw new AppError("Missing organizationId", 404);
		}

		const result = await createApiKeyService({
			organizationId,
			allowedOrigins,
		});

		return res.status(201).json(result.rawKey);
	} catch (error: any) {
		if (error.status)
			return res.status(error.status).json({ error: error.message });
		console.error(error);
		return res.status(500).json({ error: "Internal server error" });
	}
};

/**
 * Lists all API keys for the authenticated user's organization.
 *
 * @param req - Authenticated request.
 * @param res - Express response object.
 * @returns A JSON array of API keys.
 */
export const listApiKeysContorller = async (
	req: AuthenticatedRequest,
	res: Response,
) => {
	try {
		const organizationId = req.user?.organizationId;

		if (!organizationId) {
			throw new AppError("Missing organizationId", 404);
		}
		const keys = await listApiKeysService(organizationId);
		return res.status(200).json(keys);
	} catch (error: any) {
		if (error.status)
			return res.status(error.status).json({ error: error.message });
		console.error(error);
		return res.status(500).json({ error: "Internal server error" });
	}
};

/**
 * Revokes an existing API key for the authenticated user's organization.
 *
 * @param req - Authenticated request containing the key ID in params.
 * @param res - Express response object.
 * @returns A JSON confirmation message.
 */
export const revokeApiKeyController = async (
	req: AuthenticatedRequest,
	res: Response,
) => {
	try {
		const { id } = req.params;
		const organizationId = req.user?.organizationId;

		if (!organizationId) {
			throw new AppError("Missing organizationId", 404);
		}
		if (!id) {
			throw new AppError("Missing keyId", 400);
		}
		const result = await revokeApiKeyService(id as string, organizationId);
		return res.status(200).json(result);
	} catch (error: any) {
		if (error.status)
			return res.status(error.status).json({ error: error.message });
		console.error(error);
		return res.status(500).json({ error: "Internal server error" });
	}
};
