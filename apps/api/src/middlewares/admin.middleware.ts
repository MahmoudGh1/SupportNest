import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/auth.types.js";
import { AuthError } from "../utils/appError.js";

export function adminMiddleware(userRole: string) {
	return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		if (!req.user) {
			return next(new AuthError("Unauthenticated user"));
		}
		if (userRole !== req.user.role) {
			return next(new AuthError("unauthorized user"));
		}
		next();
	};
}