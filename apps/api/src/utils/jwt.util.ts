import jwt from "jsonwebtoken";
import type { TokenPayload, AuthTokens, JwtPayload } from "../types/auth.types.js";
import { AuthError } from "./appError.js";
import dotenv from "dotenv";
import type { IncomingHttpHeaders } from "http";

dotenv.config();

export function signAccessToken(payload: TokenPayload): string {
	return jwt.sign(payload, String(process.env.JWT_SECRET), {
		expiresIn: String(process.env.JWT_ACCESS_EXPIRES_IN),
	} as jwt.SignOptions);
}

export function signRefreshToken(payload: TokenPayload): string {
	return jwt.sign({ ...payload, type: "refresh" }, String(process.env.JWT_SECRET), {
		expiresIn: String(process.env.JWT_REFRESH_EXPIRES_IN),
	} as jwt.SignOptions);
}

export const extractTokenFromHeader = (headers: IncomingHttpHeaders) => {
	const authHeader = headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return null;
	}
	return authHeader.split(" ")[1];
};

export function verifyToken(token: string, secret: string): JwtPayload {
	try {
		return jwt.verify(token, secret) as JwtPayload;
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			throw new AuthError("Token expired");
		}
		throw new AuthError("Invalid token");
	}
}

export function verifyAccessToken(token: string): JwtPayload {
	try {
		return jwt.verify(token, String(process.env.JWT_SECRET), {}) as JwtPayload;
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			throw new AuthError("Token expired");
		}
		throw new AuthError("Invalid token");
	}
}

export function verifyRefreshToken(token: string): JwtPayload {
	try {
		const payload = jwt.verify(token, String(process.env.JWT_SECRET), {}) as JwtPayload & { type?: string };

		if (payload.type !== "refresh") {
			throw new AuthError("Invalid token type");
		}

		return payload;
	} catch (error) {
		if (error instanceof AuthError) throw error;
		if (error instanceof jwt.TokenExpiredError) {
			throw new AuthError("Refresh token expired, please log in again");
		}
		throw new AuthError("Invalid refresh token");
	}
}

export function generateTokenPair(payload: TokenPayload): AuthTokens {
	const accessToken = signAccessToken(payload);
	const refreshToken = signRefreshToken(payload);

	const decoded = jwt.decode(accessToken) as JwtPayload | null;

	if (!decoded?.exp || !decoded?.iat) {
		throw new Error("Failed to decode token");
	}

	return {
		accessToken,
		refreshToken,
		expiresIn: decoded.exp - decoded.iat,
	};
}
