import type { Request, Response } from "express";
import prisma from "src/config/prisma.js";
import { loginService, registerService, userService } from "src/services/auth.service.js";
import type { AuthenticatedRequest } from "src/types/auth.types.js";
import { signAccessToken, verifyAccessToken } from "src/utils/jwt.util.js";

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
	} catch (error: any) {
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

		const { id: sub, ...remaining } = result;

		const token = signAccessToken({ sub, ...remaining });
		console.log(token);

		res.cookie("accessToken", token, {
			httpOnly: true,
			secure: false,
			sameSite: "lax",
			maxAge: 1000 * 60 * 60 * 24 * 7,
		});

		return res.status(200).json({ result });
	} catch (error: any) {
		return res.status(500).json({ error: "Internal server error" });
	}
};

export const LogoutController = (req: Request, res: Response) => {
	res.clearCookie("accessToken");
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
