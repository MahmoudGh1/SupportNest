import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.util.js";
import type { AuthenticatedRequest } from "../types/auth.types.js";
import { AuthError } from "../utils/appError.js";

export function authMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
	const cookieToken = req.cookies.accessToken;

	if (cookieToken) {
		return next(new AuthError("Missing or malformed authorization header"));
	}

	try {
		const payload = verifyAccessToken(cookieToken);
		req.user = payload;
		next();
	} catch (error) {
		next(new AuthError("Session expired or invalid. Please log in again."));
	}
}
