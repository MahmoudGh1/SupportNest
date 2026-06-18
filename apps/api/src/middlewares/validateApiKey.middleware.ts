import crypto from "crypto";
import type { AuthenticatedRequest } from "src/types/auth.types.js";
import type { Request, NextFunction, Response } from "express";
import { hashApiKey } from "src/utils/crypto.utils.js";
import prisma from "src/config/prisma.js";
import apiKey from "src/utils/apiKey.utils.js";
import type { AuthenticatedWidgetRequest } from "src/types/apiKey.types.js";
import type { ApiKey } from "generated/prisma/client.js";
import AppError from "src/utils/appError.js";

export const validateApiKey = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	const authReq = req as AuthenticatedWidgetRequest;

	const incomingApiKey =
		authReq.headers["x-api-key"] || authReq.headers["x-apikey"];
	const origin = authReq.get("origin");

	if (!incomingApiKey) {
		res.status(401).json({ error: "API key is missing" });
		return;
	}

	const clientHash = hashApiKey(incomingApiKey as string);

	try {
		const apiKeyRecord = await prisma.apiKey.findUnique({
			where: {
				keyHash: clientHash,
			},
			include: { organization: true },
		});

		if (!apiKeyRecord) {
			res.status(403).json({ error: "Invalid API key" });
			return;
		}

		if (!apiKeyRecord.isActive) {
			res.status(400).json({ error: "API Key is not active, Revoked" });
			return;
		}

		const clientBuffer = Buffer.from(clientHash, "hex");
		const dbBuffer = Buffer.from(apiKeyRecord.keyHash, "hex");

		if (!crypto.timingSafeEqual(clientBuffer, dbBuffer)) {
			res.status(403).json({ error: "Invalid API key" });
			return;
		}

		await prisma.apiKey.update({
			where: {
				id: apiKeyRecord.id,
			},
			data: {
				lastUsedAt: new Date(),
			},
		});

		if (apiKeyRecord && !apiKeyRecord.organization) {
			throw new AppError("invalid api key", 400);
		}
		authReq.organization = apiKeyRecord.organization;
		authReq.apiKey = apiKeyRecord;

		next();
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
		return;
	}
};
