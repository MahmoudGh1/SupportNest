import type { Request, Response } from "express";
import { loginService, registerService, userService } from "src/services/auth.service.js";
import type { AuthenticatedRequest, TokenPayload } from "src/types/auth.types.js";
import { generateTokenPair, verifyRefreshToken } from "src/utils/jwt.util.js";
import AppError from "src/utils/appError.js";
import {
	accessCookieOptions,
	refreshCookieOptions,
} from "src/utils/cookies.util.js";

function setAuthCookies(
	res: Response,
	tokenPayload: TokenPayload,
) {
	const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

	res.cookie("accessToken", accessToken, accessCookieOptions);
	res.cookie("refreshToken", refreshToken, refreshCookieOptions);
}

function clearAuthCookies(res: Response) {
	res.clearCookie("accessToken");
	res.clearCookie("refreshToken");
}

function toTokenPayload(user: {
	id: string;
	email: string;
	role: string;
	organizationId: string | null;
}): TokenPayload {
	return {
		sub: user.id,
		email: user.email,
		role: user.role,
		organizationId: user.organizationId,
	};
}

export const RegisterController = async (req: Request, res: Response) => {
	try {
		const { businessName, email, password, firstName, lastName, planId } = req.body;

		if (!businessName || !email || !password) {
			return res.status(400).json({ error: "Missing required fields" });
		}

		const result = await registerService({
			businessName,
			email,
			password,
			firstName,
			lastName,
			planId,
		});

		return res.status(201).json(result);
	} catch (error: unknown) {
		if (error instanceof AppError) {
			return res.status(error.statusCode).json({ error: error.message });
		}
		console.error("[RegisterController]", error);
		return res.status(500).json({ error: "Internal server error" });
	}
};

export const LoginController = async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ error: "Missing required fields" });
		}

		const result = await loginService({ email, password });

		if (!result) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		setAuthCookies(res, toTokenPayload(result));

		const profile = await userService(toTokenPayload(result));

		return res.status(200).json({ result: profile });
	} catch (error: unknown) {
		if (error instanceof AppError) {
			return res.status(error.statusCode).json({ error: error.message });
		}
		console.error("[LoginController]", error);
		return res.status(500).json({ error: "Internal server error" });
	}
};

export const RefreshController = async (req: Request, res: Response) => {
	try {
		const refreshToken = req.cookies?.refreshToken;
		if (!refreshToken) {
			return res.status(401).json({ error: "No refresh token" });
		}

		const payload = verifyRefreshToken(refreshToken);
		const tokenPayload: TokenPayload = {
			sub: payload.sub,
			email: payload.email,
			role: payload.role,
			organizationId: payload.organizationId,
		};

		setAuthCookies(res, tokenPayload);

		return res.status(200).json({ ok: true });
	} catch (error: unknown) {
		clearAuthCookies(res);
		if (error instanceof AppError) {
			return res.status(error.statusCode).json({ error: error.message });
		}
		return res.status(401).json({ error: "Invalid refresh token" });
	}
};

export const LogoutController = (req: Request, res: Response) => {
	clearAuthCookies(res);
	return res.status(200).json({ message: "Token has been cleared successfully" });
};

export const userController = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const { user } = req;
		if (!user) {
			return res.status(401).json({ error: "User not found" });
		}
		const result = await userService(user);

		if (!result) {
			return res.status(401).json({ error: "User not found" });
		}

		return res.status(200).json({ result });
	} catch {
		return res.status(401).json({ error: "Invalid session" });
	}
};
