import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.util.js";
import type { AuthenticatedRequest } from "../types/auth.types.js";
import { AuthError } from "../utils/appError.js";

export function authMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
	const authHeader = req.headers.authorization;
	const cookieToken = req.cookies.accessToken;

	let token: string | null = null;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return next(new AuthError("Missing or malformed authorization header"));
	}

	if (cookieToken) {
		token = cookieToken;
	} 
	else if (authHeader.startsWith("Bearer ")) {
		token = authHeader.replace("Bearer ", "");
	}

	if (!token) {
		return next(new AuthError("Missing or malformed authorization cookie"));
	}

	try {
		const payload = verifyAccessToken(token);
		req.user = payload;
		next();
	} catch (error) {
		next(error);
	}
}
