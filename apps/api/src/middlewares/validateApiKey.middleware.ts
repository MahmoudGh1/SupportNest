import crypto from "crypto";
import type { AuthenticatedRequest } from "src/types/auth.types.js";
import type { NextFunction, Response } from "express";
import { hashApiKey } from "src/utils/crypto.utils.js";
import prisma from "src/config/prisma.js";
import apiKey from "src/utils/apiKey.utils.js";
import type { AuthenticatedWidgetRequest } from "src/types/apiKey.types.js";

export async function validateApiKey(
	req: AuthenticatedWidgetRequest,
	res: Response,
	next: NextFunction,
) {
	const incomingApiKey = req.headers["x-api-key"] || req.headers["x-apikey"];
	const origin = req.get("origin");

	if (!incomingApiKey) {
		return res.status(401).json({ error: "API key is missing" });
	}

	const clientHash = hashApiKey(incomingApiKey as string);

	try {
		const apiKeyRecord = await prisma.apiKey.findUnique({
			where: {
				keyHash: clientHash,
			},
		});

		if (!apiKeyRecord) {
			return res.status(403).json({ error: "Invalid API key" });
		}

		if (!apiKeyRecord.isActive) {
			return res.status(400).json({ error: "API Key is not active, Revoked" });
		}

		const clientBuffer = Buffer.from(clientHash, "hex");
		const dbBuffer = Buffer.from(apiKeyRecord.keyHash, "hex");

		if (!crypto.timingSafeEqual(clientBuffer, dbBuffer)) {
			return res.status(403).json({ error: "Invalid API key" });
		}

		if (!origin || !apiKeyRecord.allowedOrigins.includes(origin)) {
			return res.status(403).json({ error: "Invalid origin" });
		}

		await prisma.apiKey.update({
			where: {
				id: apiKeyRecord.id,
			},
			data: {
				lastUsedAt: new Date(),
			},
		});

		req.apiKey = apiKeyRecord;

		next();
	} catch (error) {
		return res.status(500).json({ error: "Internal server error" });
	}
}
