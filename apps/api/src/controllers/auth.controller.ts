import type { Request, Response } from "express";
import { registerService } from "src/services/auth.service.js";

/**
 * Handles register requests by validating input and creating a new organization, user, and API key.
 *
 * @param req - The Express request object containing registration payload.
 * @param res - The Express response object used to send HTTP responses.
 * @returns A JSON response with organization info and API key, or an error response.
 */
export const RegisterController = async (req: Request, res: Response) => {
  try {
    const { businessName, email, password, firstName, lastName, planId } =
      req.body;

    // 1. Basic validation
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
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
