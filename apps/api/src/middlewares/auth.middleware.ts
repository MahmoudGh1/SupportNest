import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.util.js";
import type { AuthenticatedRequest } from "../types/auth.types.js";
import { AuthError } from "../utils/appError.js";

export function authMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw new AuthError("Missing or malformed authorization header");
	}

	const authToken = authHeader.replace("Bearer ", "");

	try {
		const payload = verifyAccessToken(authToken!);
		req.user = payload;
		next();
	} catch (error) {
		next(error);
	}
}
