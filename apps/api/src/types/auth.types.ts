import type { Request } from "express";
import { Role } from "generated/prisma/enums.js";

export interface RefreshTokenInput {
	refreshToken: string;
}

export interface TokenPayload {
	sub: string;
	email: string;
	role: string;
	organizationId: string | null;
}

export interface JwtPayload extends TokenPayload {
	iat: number;
	exp: number;
}

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
}

export interface AuthenticatedRequest extends Request {
	user?: JwtPayload;
	file?: Express.Multer.File | undefined; // Add this for single file uploads (req.file)
	files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined;
}

export interface RegisterInput {
	businessName: string;
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	planId: string;
}

export interface LoginInput {
	email: string;
	password: string;
}

export interface OraganizationDataDTO {
	id: string;
	organizationId: string | null;
	email: string;
	role: Role;
	firstName: string;
	lastName: string;
	isActive: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface userData {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: string;
	organizationId: string;
	onboarded: boolean;
}
