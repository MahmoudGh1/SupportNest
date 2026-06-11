import prisma from "src/config/prisma.js";
import { Role } from "generated/prisma/enums.js";
import slugify from "src/utils/slug.utils.js";
import type {
	LoginInput,
	OraganizationDataDTO,
	RegisterInput,
	TokenPayload,
	userData,
} from "src/types/auth.types.js";
import AppError from "src/utils/appError.js";
import {
	comparePassword,
	generateSecret,
	hashPassword,
} from "src/utils/password.util.js";
import apiKey from "src/utils/apiKey.utils.js";
import { hashApiKey } from "src/utils/crypto.utils.js";
import * as jwt from "jsonwebtoken";

export const registerService = async ({
	businessName,
	email,
	password,
	firstName,
	lastName,
	planId,
}: RegisterInput) => {
	const passwordHash = await hashPassword(password);
	const widgetSecret = await generateSecret(32);
	const orgSlug = slugify(businessName);

	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		throw new AppError("Email already registered", 409);
	}

	try {
		const org = await prisma.organization.create({
			data: {
				name: businessName,
				slug: orgSlug,
				email,
				widgetSecret: widgetSecret,
				isActive: true,
				planId: planId,
				users: {
					create: {
						email,
						passwordHash,
						role: Role.ORG_ADMIN,
						firstName,
						lastName,
						isActive: true,
					},
				},
			},
			select: {
				id: true,
				name: true,
				slug: true,
				widgetSecret: true,
			},
		});
		return {
			organization: {
				id: org.id,
				name: org.name,
				slug: org.slug,
				widgetSecret: org.widgetSecret,
			},
		};
	} catch (err) {
		throw new AppError("Transaction Failed", 500);
	}
};

export const loginService = async ({
	email,
	password,
}: LoginInput): Promise<OraganizationDataDTO> => {
	try {
		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) {
			throw new AppError("Wrong Email or Password", 401);
		}
		console.log(user);
		const passwordCheck = await comparePassword(password, user.passwordHash);
		if (!passwordCheck) {
			throw new AppError("Wrong Email or Password", 401);
		}
		const { passwordHash: _password, ...dataDTO } = user;
		console.log(dataDTO);
		return dataDTO;
	} catch (err) {
		console.log(err);
		throw err;
	}
};

export const userService = async (
	payloadToken: TokenPayload,
): Promise<userData> => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: payloadToken.sub },
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
				organizationId: true,
			},
		});

		if (!user) {
			throw new AppError("User not found!", 401);
		}

		return user as userData;
	} catch (err) {
		throw err;
	}
};

export async function validateApiKey(rawKey: string, origin?: string) {
	const incomingApiKey = rawKey;

	const clientHash = hashApiKey(incomingApiKey as string);

	const apiKeyRecord = await prisma.apiKey.findUnique({
		where: {
			keyHash: clientHash,
		},
		include: { organization: true },
	});

	if (!apiKeyRecord || !apiKeyRecord.isActive) {
		return null;
	}

	if (origin && !apiKeyRecord.allowedOrigins.includes(origin)) {
		return null;
	}

	await prisma.apiKey.update({
		where: {
			id: apiKeyRecord.id,
		},
		data: {
			lastUsedAt: new Date(),
		},
	});

	return apiKeyRecord;
}

export async function verifyCustomerJWT(
	token: string,
	organizationId: string,
) {
	const org = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { widgetSecret: true },
	});

	if (!org) return null;

	try {
		const payload = jwt.verify(token, org.widgetSecret) as any;
		return {
			externalId: payload.sub,
			email: payload.email,
			name: payload.name,
			metadata: payload,
		};
	} catch {
		return null;
	}
}
