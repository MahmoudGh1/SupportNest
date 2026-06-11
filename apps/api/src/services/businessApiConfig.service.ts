import prisma from "src/config/prisma.js";
import AppError from "src/utils/appError.js";
import { encrypt, decrypt } from "src/utils/encryption.util.js";
import { ApiAuthType } from "generated/prisma/enums.js";

interface SaveApiConfigInput {
	organizationId: string;
	baseUrl: string;
	authType: ApiAuthType;
	authValue: string;
	headerName?: string;
}

export async function saveApiConfigService(input: SaveApiConfigInput) {
	const { organizationId, baseUrl, authType, authValue, headerName } = input;

	if (authType === ApiAuthType.API_KEY && !headerName) {
		throw new AppError("headerName is required when authType is API_KEY", 400);
	}

	try {
		new URL(baseUrl);
	} catch {
		throw new AppError("baseUrl must be a valid URL", 400);
	}

	const encryptedAuthValue = encrypt(authValue);

	const config = await prisma.businessApiConfig.upsert({
		where: { organizationId },
		update: {
			baseUrl,
			authType,
			authValue: encryptedAuthValue,
			headerName: headerName ?? null,
			isVerified: false,
			lastVerifiedAt: null,
		},
		create: {
			organizationId,
			baseUrl,
			authType,
			authValue: encryptedAuthValue,
			headerName: headerName ?? null,
		},
	});

	return {
		id: config.id,
		baseUrl: config.baseUrl,
		authType: config.authType,
		headerName: config.headerName,
		isVerified: config.isVerified,
	};
}

export async function getApiConfigService(organizationId: string) {
	const config = await prisma.businessApiConfig.findUnique({
		where: { organizationId },
		select: {
			id: true,
			baseUrl: true,
			authType: true,
			headerName: true,
			isVerified: true,
			lastVerifiedAt: true,
			createdAt: true,
			updatedAt: true,
			// authValue intentionally excluded
		},
	});

	if (!config) return null;
	return config;
}

export async function verifyApiConfigService(organizationId: string) {
	const config = await prisma.businessApiConfig.findUnique({
		where: { organizationId },
	});

	if (!config) throw new AppError("No API config found. Save your config first.", 404);

	let authValue: string;
	try {
		authValue = decrypt(config.authValue);
	} catch {
		throw new AppError("Stored auth token is corrupted. Please re-save your config.", 500);
	}

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (config.authType === ApiAuthType.BEARER) {
		headers["Authorization"] = `Bearer ${authValue}`;
	} else if (config.authType === ApiAuthType.API_KEY) {
		const headerName = config.headerName ?? "x-api-key";
		headers[headerName] = authValue;
	} else if (config.authType === ApiAuthType.BASIC) {
		const encoded = Buffer.from(authValue).toString("base64");
		headers["Authorization"] = `Basic ${encoded}`;
	}

	const urlToTest = config.testEndpoint ? `${config.baseUrl.replace(/\/$/, "")}/${config.testEndpoint.replace(/^\//, "")}` : config.baseUrl;

	let isVerified = false;
	let verificationError: string | null = null;

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 8000);

		const response = await fetch(urlToTest, {
			method: "GET",
			headers,
			signal: controller.signal,
		});

		clearTimeout(timeout);

		if (response.status >= 500) {
			verificationError = `Your API server returned ${response.status}. Check that your server is running correctly.`;
		} else {
			isVerified = true;
		}
	} catch (err: any) {
		if (err.name === "AbortError") {
			verificationError = "Request timed out after 8 seconds. Check your base URL is correct and your server is reachable.";
		} else {
			verificationError = `Could not reach your API: ${err.message}`;
		}
	}

	await prisma.businessApiConfig.update({
		where: { organizationId },
		data: { isVerified, lastVerifiedAt: new Date() },
	});

	if (!isVerified) throw new AppError(verificationError ?? "Verification failed", 400);

	return {
		isVerified: true,
		message: "Your API is reachable. Configuration verified successfully.",
	};
}
