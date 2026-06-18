import type { ColumnConfig } from "src/types/businessTable.types.js";
import AppError from "./appError.js";
import prisma from "src/config/prisma.js";
import { decrypt } from "./encryption.util.js";
import { ApiAuthType } from "generated/prisma/enums.js";

export function inferType(value: unknown): ColumnConfig["type"] {
	if (value === null || value === undefined) return "null";
	if (typeof value === "boolean") return "boolean";
	if (typeof value === "number") return "number";
	if (typeof value === "string") return "string";
	if (Array.isArray(value)) return "array";
	if (typeof value === "object") return "object";
	return "string";
}

export function detectColumns(rows: any[]): ColumnConfig[] {
	const sample = rows.find((r) => r && typeof r === "object");
	if (!sample) return [];

	return Object.keys(sample).map((key) => ({
		key,
		type: inferType(sample[key]),
	}));
}

export function validateRowAgainstSchema(rowData: Record<string, any>, columnConfig: ColumnConfig[]): void {
	for (const col of columnConfig) {
		const value = rowData[col.key];

		if (value === undefined) continue;

		// null is always acceptable
		if (value === null) continue;

		const actual = inferType(value);

		if (col.type === "number" && actual === "string") {
			if (isNaN(Number(value))) {
				throw new AppError(`Field "${col.key}" expects a number but got string "${value}" which cannot be converted.`, 400);
			}
			continue;
		}

		if (actual !== col.type) {
			throw new AppError(`Field "${col.key}" expects type "${col.type}" but received "${actual}".`, 400);
		}
	}
}

export async function buildAuthHeaders(organizationId: string): Promise<Record<string, string>> {
	const config = await prisma.businessApiConfig.findUnique({
		where: { organizationId },
	});

	if (!config) {
		throw new AppError("No API configuration found. Please configure your API connection first.", 400);
	}

	if (!config.isVerified) {
		throw new AppError("Your API configuration is not verified. Please verify it in Settings before using Business Tables.", 400);
	}

	let authValue: string;
	try {
		authValue = decrypt(config.authValue);
	} catch {
		throw new AppError("Stored auth token is corrupted. Please re-save your API configuration.", 500);
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

	return headers;
}

export async function getBaseUrl(organizationId: string): Promise<string> {
	const config = await prisma.businessApiConfig.findUnique({
		where: { organizationId },
		select: { baseUrl: true, isVerified: true },
	});

	if (!config?.isVerified) {
		throw new AppError("No verified API configuration found. Configure your API first.", 400);
	}

	return config.baseUrl.replace(/\/$/, "");
}