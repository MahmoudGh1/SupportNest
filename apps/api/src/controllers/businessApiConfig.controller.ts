import type { Response, RequestHandler } from "express";
import type { AuthenticatedRequest } from "src/types/auth.types.js";
import { saveApiConfigService, getApiConfigService, verifyApiConfigService } from "src/services/businessApiConfig.service.js";
import AppError from "src/utils/appError.js";
import asyncHandler from "src/utils/asyncHandler.js";
import { ApiAuthType } from "generated/prisma/enums.js";

export const saveApiConfigController: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
	const organizationId = req.user?.organizationId;
	if (!organizationId) throw new AppError("Unauthorized", 401);

	const { baseUrl, authType, authValue, headerName, testEndpoint } = req.body;
	// baseUrl = the api document
	// authType / authValue = customer authentication
	// headerName = for authType API KEY
	if (!baseUrl || !authType || !authValue) {
		throw new AppError("baseUrl, authType and authValue are required", 400);
	}

	if (!Object.values(ApiAuthType).includes(authType)) {
		throw new AppError(`authType must be one of: ${Object.values(ApiAuthType).join(", ")}`, 400);
	}

	const result = await saveApiConfigService({
		organizationId,
		baseUrl,
		authType,
		authValue,
		headerName,
		testEndpoint
	});

	res.status(200).json(result);
});

export const getApiConfigController: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
	const organizationId = req.user?.organizationId;
	if (!organizationId) throw new AppError("Unauthorized", 401);

	const result = await getApiConfigService(organizationId);
	res.status(200).json(result ?? { configured: false });
});
//
export const verifyApiConfigController: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
	const organizationId = req.user?.organizationId;
	if (!organizationId) throw new AppError("Unauthorized", 401);

	const result = await verifyApiConfigService(organizationId);
	res.status(200).json(result);
});
