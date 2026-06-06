import prisma from "src/config/prisma.js";
import { Role } from "generated/prisma/enums.js";
import slugify from "src/utils/slug.utils.js";
import type {
	LoginInput,
	OraganizationDataDTO,
	RegisterInput,
} from "src/types/auth.types.js";
import AppError from "src/utils/appError.js";
import {
	comparePassword,
	generateSecret,
	hashPassword,
} from "src/utils/password.util.js";

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
			throw new AppError("Wrong Email or Password", 409);
		}

		const passwordCheck = await comparePassword(password, user.passwordHash);
		if (!passwordCheck) {
			throw new AppError("Wrong Email or Password", 409);
		}

		const { passwordHash: _password, ...dataDTO } = user;
		return dataDTO;
	} catch (err) {
		throw err;
	}
};
