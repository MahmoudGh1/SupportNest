import crypto from "crypto";
import type { AuthenticatedRequest } from "src/types/auth.types.js";
import type { NextFunction, Response } from "express";
import { hashApiKey } from "src/utils/crypto.utils.js";
import prisma from "src/config/prisma.js";
import apiKey from "src/utils/apiKey.utils.js";
import type { AuthenticatedWidgetRequest } from "src/types/apiKey.types.js";
import type { ApiKey } from "generated/prisma/client.js";

export const validateApiKey = async (
	req: AuthenticatedWidgetRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	const incomingApiKey = req.headers["x-api-key"] || req.headers["x-apikey"];

	const origin = req.get("origin");

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

		if (
			apiKeyRecord.allowedOrigins.length > 0 &&
			(!origin || !apiKeyRecord.allowedOrigins.includes(origin))
		) {
			res.status(403).json({ error: "Origin not allowed" });
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

		req.organization = apiKeyRecord.organization;
		req.apiKey = apiKeyRecord;

		next();
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
		return;
	}
};
