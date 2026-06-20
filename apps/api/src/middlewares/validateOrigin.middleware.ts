import type { Request, Response, NextFunction } from "express";
import { auth } from "node_modules/google-auth-library/build/src/index.js";
import type { AuthenticatedWidgetRequest } from "src/types/apiKey.types.js";

export async function validateOrigin(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const authReq = req as AuthenticatedWidgetRequest;
	const origin = req.headers.origin;
	const isAllowed =
		typeof origin === "string" &&
		authReq.apiKey.allowedOrigins.includes(origin);

	if (!isAllowed) {
		return res.status(403).json({ message: "Origin not allowed." });
	}
	next();
}
