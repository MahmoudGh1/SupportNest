import type { Response } from "express";
import type { AuthenticatedRequest } from "src/types/auth.types.js";
import { updateProfileService, updatePasswordService } from "src/services/user.service.js";

// ─── GET /users/me ────────────────────────────────────────────────────────────
// Returns the current user's profile from the JWT payload
// (no DB call needed — JWT already has the data)
export const getMeController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    return res.status(200).json({
      success: true,
      result: {
        id:             user.sub,
        email:          user.email,
        firstName:      user.firstName,
        lastName:       user.lastName,
        role:           user.role,
        organizationId: user.organizationId,
      },
    });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ─── PATCH /users/me ──────────────────────────────────────────────────────────
// Body: { firstName, lastName, email }
export const updateProfileController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { firstName, lastName, email } = req.body;

    if (!firstName?.trim()) return res.status(400).json({ error: "First name is required." });
    if (!lastName?.trim())  return res.status(400).json({ error: "Last name is required." });
    if (!email?.trim())     return res.status(400).json({ error: "Email is required." });
    if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: "Enter a valid email." });

    const updated = await updateProfileService(userId, { firstName, lastName, email });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      result:  updated,
    });
  } catch (error: any) {
    const status = error.statusCode ?? 500;
    return res.status(status).json({ error: error.message ?? "Internal server error" });
  }
};

// ─── PATCH /users/me/password ─────────────────────────────────────────────────
// Body: { current_password, new_password }
export const updatePasswordController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { current_password, new_password } = req.body;

    if (!current_password) return res.status(400).json({ error: "Current password is required." });
    if (!new_password)     return res.status(400).json({ error: "New password is required." });

    await updatePasswordService(userId, current_password, new_password);

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error: any) {
    const status = error.statusCode ?? 500;
    return res.status(status).json({ error: error.message ?? "Internal server error" });
  }
};