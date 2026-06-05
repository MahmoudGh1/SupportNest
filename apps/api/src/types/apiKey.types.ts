import type { Request } from "express";

type UUID = string;

export interface CreateApiKeyInput {
	organizationId: string;
	allowedOrigins: string[];
}

export interface ApiKey {
	id: UUID;
	keyHash: UUID;
	organizationId: string;
	keyPrefix: string;
	name: string;
	allowedOrigins: string[];
	isActive: boolean;
	lastUsedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface AuthenticatedWidgetRequest extends Request {
	apiKey: ApiKey;
}
