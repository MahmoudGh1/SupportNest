import prisma from "src/config/prisma.js";
import AppError from "src/utils/appError.js";
import { comparePassword, hashPassword } from "src/utils/password.util.js";

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
export async function updateProfileService(
  userId: string,
  data: { firstName: string; lastName: string; email: string },
) {
  // Check email not taken by another user
  if (data.email) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing && existing.id !== userId) {
      throw new AppError("Email already in use by another account.", 409);
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: data.firstName,
      lastName:  data.lastName,
      email:     data.email,
    },
    select: {
      id:             true,
      email:          true,
      firstName:      true,
      lastName:       true,
      role:           true,
      organizationId: true,
      isActive:       true,
      createdAt:      true,
      updatedAt:      true,
    },
  });

  return updated;
}

// ─── UPDATE PASSWORD ──────────────────────────────────────────────────────────
export async function updatePasswordService(
  userId:          string,
  currentPassword: string,
  newPassword:     string,
) {
  // 1. Fetch user with password hash
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) throw new AppError("User not found.", 404);

  // 2. Verify current password
  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) throw new AppError("Current password is incorrect.", 401);

  // 3. Validate new password length
  if (newPassword.length < 8) {
    throw new AppError("New password must be at least 8 characters.", 400);
  }

  // 4. Hash and save
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data:  { passwordHash },
  });

  return { success: true };
}