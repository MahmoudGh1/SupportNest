import type { Request, Response } from "express";
import { completeRegistrationService, forgotPasswordService, loginService, registerPaidService, registerService, registerWithGoogleService, resetPasswordService, sendVerificationService, userService, verifyEmailService } from "src/services/auth.service.js";
import type { AuthenticatedRequest, TokenPayload } from "src/types/auth.types.js";
import { generateTokenPair, verifyRefreshToken } from "src/utils/jwt.util.js";
import AppError from "src/utils/appError.js";
import { accessCookieOptions, refreshCookieOptions } from "src/utils/cookies.util.js";
import { loginWithGoogleService, verifyGoogleToken } from "src/services/auth.service.js";

function setAuthCookies(res: Response, tokenPayload: TokenPayload) {
	const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

	res.cookie("accessToken", accessToken, accessCookieOptions);
	res.cookie("refreshToken", refreshToken, refreshCookieOptions);
}

function clearAuthCookies(res: Response) {
	res.clearCookie("accessToken", accessCookieOptions);
	res.clearCookie("refreshToken", refreshCookieOptions);
}

function toTokenPayload(user: { id: string; email: string; role: string; organizationId: string | null }): TokenPayload {
	return {
		sub: user.id,
		email: user.email,
		role: user.role,
		organizationId: user.organizationId,
	};
}

export const GoogleLoginController = async (req: Request, res: Response) => {
	try {
		const { idToken } = req.body;
		if (!idToken) {
			return res.status(400).json({ error: "Missing Google token" });
		}

		const { email } = await verifyGoogleToken(idToken);
		const result = await loginWithGoogleService(email);

		const tokenPayload = toTokenPayload(result);
		const profile = await userService(tokenPayload);

		// if (!profile.hasActiveSubscription && profile.role == "ORG_ADMIN" && profile.organizationId) {
		// 	clearAuthCookies(res);
		// 	return res.status(403).json({
		// 		error: "Your account does not have an active subscription. Please complete payment first.",
		// 	});
		// }

		if (profile.role === "ORG_ADMIN" && (!profile.organizationId || !profile.hasActiveSubscription)) {
			clearAuthCookies(res);
			return res.status(403).json({
				error: profile.organizationId ? "Your account does not have an active subscription. Please complete payment first." : "Please finish setting up your business and complete payment to continue.",
			});
		}

		setAuthCookies(res, tokenPayload);

		return res.status(200).json({ result: profile });
	} catch (error: unknown) {
		if (error instanceof AppError) {
			return res.status(error.statusCode).json({ error: error.message });
		}
		console.error("[GoogleLoginController]", error);
		return res.status(500).json({ error: "Internal server error" });
	}
};

export const RegisterController = async (req: Request, res: Response) => {
	try {
		const { email, password, firstName, lastName } = req.body;

		// remove businessName from required check
		if (!email || !password) {
			return res.status(400).json({ error: "Missing required fields" });
		}

		const result = await registerService({
			email,
			password,
			firstName,
			lastName,
		});

		// remove the loginService call entirely
		// just return the userId so frontend can redirect to verify
		return res.status(201).json(result);
	} catch (error: unknown) {
		if (error instanceof AppError) {
			return res.status(error.statusCode).json({ error: error.message });
		}
		console.error("[RegisterController]", error);
		return res.status(500).json({ error: "Internal server error" });
	}
};

export const RegisterPaidController = async (req: Request, res: Response) => {
	try {
		const { businessName, email, password, firstName, lastName, planId, amount, currency, isAnnual } = req.body;

		if (!businessName || !email || !password || !planId || amount == null) {
			return res.status(400).json({ error: "Missing required fields" });
		}

		const user = await registerPaidService({
			businessName,
			email,
			password,
			firstName,
			lastName,
			planId,
			amount: Number(amount),
			currency: currency || "EGP",
			isAnnual: Boolean(isAnnual),
		});

		const tokenPayload = toTokenPayload(user);
		setAuthCookies(res, tokenPayload);

		const profile = await userService(tokenPayload);

		return res.status(201).json({ result: profile });
	} catch (error: unknown) {
		if (error instanceof AppError) {
			return res.status(error.statusCode).json({ error: error.message });
		}
		console.error("[RegisterPaidController]", error);
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

		const tokenPayload = toTokenPayload(result);
		const profile = await userService(tokenPayload);

		// if (!profile.hasActiveSubscription && profile.role == "ORG_ADMIN" && profile.organizationId) {
		// 	clearAuthCookies(res);
		// 	return res.status(403).json({
		// 		error: "Your account does not have an active subscription. Please complete payment first.",
		// 	});
		// }

		if (profile.role === "ORG_ADMIN" && (!profile.organizationId || !profile.hasActiveSubscription)) {
			clearAuthCookies(res);
			return res.status(403).json({
				error: profile.organizationId ? "Your account does not have an active subscription. Please complete payment first." : "Please finish setting up your business and complete payment to continue.",
			});
		}

		setAuthCookies(res, tokenPayload);

		return res.status(200).json({ result: profile });
	} catch (error: unknown) {
		if (error instanceof AppError) {
			if (error instanceof AppError && error.message === "EMAIL_NOT_VERIFIED") {
				return res.status(403).json({
					code: "EMAIL_NOT_VERIFIED",
					error: "Please verify your email address before logging in.",
					userId: (error as AppError & { userId?: string }).userId,
				});
			}
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

export const SendVerificationController = async (req: Request, res: Response) => {
	try {
		const { userId, email } = req.body;
		if (!userId || !email) {
			return res.status(400).json({ error: "Missing userId or email" });
		}
		await sendVerificationService(userId, email);
		return res.status(200).json({ message: "Verification code sent" });
	} catch (error) {
		if (error instanceof AppError) return res.status(error.statusCode).json({ error: error.message });
		return res.status(500).json({ error: "Internal server error" });
	}
};

export const VerifyEmailController = async (req: Request, res: Response) => {
	try {
		const { userId, code } = req.body;
		if (!userId || !code) {
			return res.status(400).json({ error: "Missing userId or code" });
		}
		await verifyEmailService(userId, code);
		return res.status(200).json({ message: "Email verified successfully" });
	} catch (error) {
		if (error instanceof AppError) return res.status(error.statusCode).json({ error: error.message });
		return res.status(500).json({ error: "Internal server error" });
	}
};

export const CompleteRegistrationController = async (req: Request, res: Response) => {
	try {
		const { userId, businessName, planId, amount, currency, isAnnual } = req.body;
		if (!userId || !businessName || !planId) {
			// if (!userId || !businessName || !planId || amount == null) {
			return res.status(400).json({ error: "Missing required fields" });
		}
		const user = await completeRegistrationService({
			userId,
			businessName,
			planId,
			// amount: Number(amount),
			// currency: currency || "EGP",
			// isAnnual: Boolean(isAnnual),
		});
		const tokenPayload = toTokenPayload(user!);
		setAuthCookies(res, tokenPayload);
		const profile = await userService(tokenPayload);
		return res.status(201).json({ result: profile });
	} catch (error) {
		if (error instanceof AppError) return res.status(error.statusCode).json({ error: error.message });
		return res.status(500).json({ error: "Internal server error" });
	}
};

export const ForgotPasswordController = async (req: Request, res: Response) => {
	try {
		const { email } = req.body;
		if (!email) {
			return res.status(400).json({ error: "Email is required" });
		}
		await forgotPasswordService(email);
		return res.status(200).json({ message: "If that email exists, a reset link has been sent." });
	} catch (error: unknown) {
		if (error instanceof AppError) {
			return res.status(error.statusCode).json({ error: error.message });
		}
		console.error("[ForgotPasswordController]", error);
		return res.status(500).json({ error: "Internal server error" });
	}
};

export const ResetPasswordController = async (req: Request, res: Response) => {
	try {
		const { token, newPassword } = req.body;
		if (!token || !newPassword) {
			return res.status(400).json({ error: "Token and new password are required" });
		}
		await resetPasswordService(token, newPassword);
		return res.status(200).json({ message: "Password reset successfully. You can now log in." });
	} catch (error: unknown) {
		if (error instanceof AppError) {
			return res.status(error.statusCode).json({ error: error.message });
		}
		console.error("[ResetPasswordController]", error);
		return res.status(500).json({ error: "Internal server error" });
	}
};

export const GoogleRegisterController = async (req: Request, res: Response) => {
	try {
		const { idToken } = req.body;
		if (!idToken) {
			return res.status(400).json({ error: "Missing Google token" });
		}

		const { email, name } = await verifyGoogleToken(idToken);
		const result = await registerWithGoogleService(email, name);

		return res.status(200).json(result);
	} catch (error: unknown) {
		if (error instanceof AppError) {
			return res.status(error.statusCode).json({ error: error.message });
		}
		console.error("[GoogleRegisterController]", error);
		return res.status(500).json({ error: "Internal server error" });
	}
};
