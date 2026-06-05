import type { Request, Response } from "express";
import { loginService, registerService } from "src/services/auth.service.js";
import { signAccessToken } from "src/utils/jwt.util.js";

export const RegisterController = async (req: Request, res: Response) => {
	try {
		const { businessName, email, password, firstName, lastName, planId } = req.body;

		if (!businessName || !email || !password) {
			return res.status(400).json({ error: "Missing required fields" });
		}

		const result = await registerService({ businessName, email, password, firstName, lastName, planId });
		console.log(result)

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

		const {id: sub, ...remaining} = result

		const token = signAccessToken({sub, ...remaining})

		return res.status(200).json({ token, remaining });
	} catch (error: any) {
		return res.status(500).json({ error: "Internal server error" });
	}
};