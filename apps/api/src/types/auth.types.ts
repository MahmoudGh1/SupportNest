import type { Request } from "express";

export interface RefreshTokenInput {
	refreshToken: string;
}

export interface TokenPayload {
	sub: string;
	email: string;
	role: string;
	organizationId: string;
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
}
