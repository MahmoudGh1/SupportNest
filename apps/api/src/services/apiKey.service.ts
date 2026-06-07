import prisma from "src/config/prisma.js";
import type { CreateApiKeyInput } from "../types/apiKey.types.js";
import apiKey from "src/utils/apiKey.utils.js";
import AppError from "src/utils/appError.js";

/**
 * Creates a new API key for the specified organization.
 *
 * @param params.organizationId - The ID of the organization creating the key.
 * @param params.allowedOrigins - Optional allowed origins for the key.
 * @returns The generated API key and its secret.
 * @throws When the organization cannot be found.
 */
export const createApiKeyService = async ({ organizationId, allowedOrigins }: CreateApiKeyInput) => {
	// Check org exists and is active
	const org = await prisma.organization.findUnique({
		where: { id: organizationId },
	});

	if (!org) throw new AppError("Organization not found", 404);

	// Generate api key — using apiKey utils

	const { apiKey: generatedApiKey, rawKey } = await apiKey(org, allowedOrigins);

	return { apiKey: generatedApiKey, rawKey };
};

/**
 * Retrieves all API keys for the given organization.
 *
 * @param organizationId - The organization ID to list API keys for.
 * @returns A list of API key records without exposing secret hashes.
 */
export const listApiKeysService = async (organizationId: string) => {
	const keys = await prisma.apiKey.findMany({
		where: { organizationId },
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			name: true,
			keyPrefix: true, // e.g "sk_a3f9b2" — safe to show
			allowedOrigins: true,
			isActive: true,
			lastUsedAt: true,
			createdAt: true,
			// keyHash is never selected — never returned
		},
	});

	return keys;
};

/**
 * Revokes a specific API key belonging to an organization.
 *
 * @param keyId - The ID of the API key to revoke.
 * @param organizationId - The organization that owns the key.
 * @returns Confirmation that the key was revoked.
 * @throws When the key is missing or already revoked.
 */
export const revokeApiKeyService = async (keyId: string, organizationId: string) => {
	// Verify key belongs to this org before touching it
	const key = await prisma.apiKey.findUnique({
		where: { id: keyId, organizationId },
	});

	if (!key) throw new AppError("API key not found", 404);
	if (!key.isActive) throw new AppError("Key is already revoked", 400);

	await prisma.apiKey.update({
		where: { id: keyId },
		data: { isActive: false },
	});

	return { success: true, message: "API key revoked" };
};
