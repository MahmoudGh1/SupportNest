import prisma from "src/config/prisma.js";
import { generateSecret, hashPassword } from "./password.util.js";
import { generateApiKey, hashApiKey } from "src/utils/crypto.utils.js";

export default async function apiKey(organization: any, allowedOrigins: any) {
	const rawKey = generateApiKey();
	const hashKey = hashApiKey(rawKey);
	const apiKey = await prisma.apiKey.create({
		data: {
			organizationId: organization.id,
			keyHash: hashKey,
			keyPrefix: rawKey.slice(0, 8),
			name: "Default",
			allowedOrigins: allowedOrigins,
			isActive: true,
		},
	});
	return { apiKey, rawKey };
}
