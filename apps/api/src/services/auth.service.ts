import prisma from "src/config/prisma.js";
import { PaymentStatus, Role } from "generated/prisma/enums.js";
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
import { OAuth2Client } from "google-auth-library";

<<<<<<< HEAD
export const registerService = async ({
	businessName,
	email,
	password,
	firstName,
	lastName,
	planId,
}: RegisterInput) => {
=======
export const registerService = async ({ businessName, email, password, firstName, lastName, planId }: RegisterInput) => {
	const normalizedEmail = email.trim().toLowerCase();
>>>>>>> origin/LocalFixes
	const passwordHash = await hashPassword(password);
	const widgetSecret = await generateSecret(32);
	const orgSlug = slugify(businessName);

	const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
	if (existing) {
		throw new AppError("Email already registered", 409);
	}

	try {
		const org = await prisma.organization.create({
			data: {
				name: businessName,
				slug: orgSlug,
				email: normalizedEmail,
				widgetSecret: widgetSecret,
				isActive: true,
				planId: planId,
				users: {
					create: {
						email: normalizedEmail,
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

<<<<<<< HEAD
export const loginService = async ({
	email,
	password,
}: LoginInput): Promise<OraganizationDataDTO> => {
=======
interface RegisterPaidInput extends RegisterInput {
	amount: number;
	currency: string;
	isAnnual: boolean;
}

export const registerPaidService = async ({ businessName, email, password, firstName, lastName, planId, amount, currency, isAnnual }: RegisterPaidInput): Promise<OraganizationDataDTO> => {
	const normalizedEmail = email.trim().toLowerCase();
	const passwordHash = await hashPassword(password);
	const widgetSecret = await generateSecret(32);
	const orgSlug = slugify(businessName);

	const existing = await prisma.user.findUnique({
		where: { email: normalizedEmail },
	});
	if (existing) {
		throw new AppError("Email already registered", 409);
	}

	const pricing = await prisma.pricing.findFirst({
		where: { id: planId, isActive: true },
		select: { id: true },
	});
	if (!pricing) {
		throw new AppError("Pricing plan not found", 404);
	}

	const periodDays = isAnnual ? 365 : 30;
	const billingPeriodStart = new Date();
	const billingPeriodEnd = new Date(billingPeriodStart.getTime() + periodDays * 24 * 60 * 60 * 1000);

	try {
		const createdUser = await prisma.$transaction(async (tx) => {
			const organization = await tx.organization.create({
				data: {
					name: businessName,
					slug: orgSlug,
					email: normalizedEmail,
					widgetSecret,
					isActive: true,
					planId,
				},
				select: {
					id: true,
				},
			});

			const user = await tx.user.create({
				data: {
					organizationId: organization.id,
					email: normalizedEmail,
					passwordHash,
					role: Role.ORG_ADMIN,
					firstName,
					lastName,
					isActive: true,
				},
				select: {
					id: true,
					email: true,
					role: true,
					organizationId: true,
					firstName: true,
					lastName: true,
					isActive: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			await tx.payment.create({
				data: {
					organizationId: organization.id,
					pricingId: planId,
					amount,
					currency,
					status: PaymentStatus.SUCCEEDED,
					paymentProvider: "checkout",
					providerPaymentId: `checkout_${organization.id}_${Date.now()}`,
					billingPeriodStart,
					billingPeriodEnd,
				},
			});

			return user;
		});

		return createdUser;
	} catch (err) {
		throw new AppError("Transaction Failed", 500);
	}
};

export const loginService = async ({ email, password }: LoginInput): Promise<OraganizationDataDTO> => {
>>>>>>> origin/LocalFixes
	try {
		const normalizedEmail = email.trim().toLowerCase();
		const user = await prisma.user.findUnique({
			where: { email: normalizedEmail },
		});
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

<<<<<<< HEAD
export const userService = async (
	payloadToken: TokenPayload,
): Promise<userData> => {
=======
export async function hasActiveSubscription(organizationId: string | null): Promise<boolean> {
	if (!organizationId) return false;
	const active = await prisma.payment.findFirst({
		where: {
			organizationId,
			status: PaymentStatus.SUCCEEDED,
			billingPeriodEnd: { gt: new Date() },
		},
	});
	return Boolean(active);
}

export const userService = async (payloadToken: TokenPayload): Promise<userData> => {
>>>>>>> origin/LocalFixes
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
				organization: { select: { name: true, planId: true } },
			},
		});

		if (!user) {
			throw new AppError("User not found!", 401);
		}

		const activeSubscription = await hasActiveSubscription(user.organizationId);

		return {
			id: user.id,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role,
			organizationId: user.organizationId,
			organizationName: user.organization?.name ?? null,
			currentPlanId: user.organization?.planId ?? null,
			onboarded: Boolean(user.organizationId),
			hasActiveSubscription: activeSubscription,
		};
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

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(idToken: string) {
	const ticket = await googleClient.verifyIdToken({
		idToken,
		audience: process.env.GOOGLE_CLIENT_ID,
	});
	const payload = ticket.getPayload();
	if (!payload || !payload.email) {
		throw new AppError("Invalid Google token", 401);
	}
	return { email: payload.email.trim().toLowerCase(), name: payload.name };
}

export const loginWithGoogleService = async (email: string): Promise<OraganizationDataDTO> => {
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) {
		throw new AppError("Wrong Email or Password", 401);
	}
	const { passwordHash: _password, ...dataDTO } = user;
	return dataDTO;
};
