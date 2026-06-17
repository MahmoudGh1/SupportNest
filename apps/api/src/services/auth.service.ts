import prisma from "src/config/prisma.js";
import { PaymentStatus, Role } from "generated/prisma/enums.js";
import slugify from "src/utils/slug.utils.js";
import type {
  LoginInput,
  OraganizationDataDTO,
  RegisterInput,
  TokenPayload,
  userData,
} from "src/types/auth.types.js";
import AppError from "src/utils/appError.js";
import {
  comparePassword,
  generateSecret,
  hashPassword,
} from "src/utils/password.util.js";
import apiKey from "src/utils/apiKey.utils.js";
import { generateResetToken, hashApiKey } from "src/utils/crypto.utils.js";
import * as jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "src/config/mailer.js";
import { enqueueNotification } from "src/queues/notification.queue.js";

export const registerService = async ({
  email,
  password,
  firstName,
  lastName,
}: Omit<RegisterInput, "businessName" | "planId">) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing && existing.isEmailVerified) {
    throw new AppError("Email already registered", 409);
  }

  if (existing && !existing.isEmailVerified) {
    await sendVerificationService(existing.id, normalizedEmail);
    return { userId: existing.id, email: normalizedEmail, alreadyExists: true };
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      role: Role.ORG_ADMIN,
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      isActive: true,
      isEmailVerified: false,
    },
    select: { id: true, email: true },
  });

  await sendVerificationService(user.id, normalizedEmail);

  return { userId: user.id, email: normalizedEmail, alreadyExists: false };
};

interface RegisterPaidInput extends RegisterInput {
  amount: number;
  currency: string;
  isAnnual: boolean;
}

export const registerPaidService = async ({
  businessName,
  email,
  password,
  firstName,
  lastName,
  planId,
  amount,
  currency,
  isAnnual,
}: RegisterPaidInput): Promise<OraganizationDataDTO> => {
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);
  const widgetSecret = await generateSecret(32);
  const orgSlug = slugify(businessName);

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    throw new AppError("Email already registered", 409);
  }

  const pricing = await prisma.pricing.findFirst({
    where: { id: planId, isActive: true },
    select: { id: true },
  });
  if (!pricing) {
    throw new AppError("Pricing plan not found", 404);
  }

  const periodDays = isAnnual ? 365 : 30;
  const billingPeriodStart = new Date();
  const billingPeriodEnd = new Date(
    billingPeriodStart.getTime() + periodDays * 24 * 60 * 60 * 1000,
  );

  try {
    const createdUser = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: businessName,
          slug: orgSlug,
          email: normalizedEmail,
          widgetSecret,
          isActive: true,
          planId,
        },
        select: {
          id: true,
        },
      });

      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          email: normalizedEmail,
          passwordHash,
          role: Role.ORG_ADMIN,
          firstName,
          lastName,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          role: true,
          organizationId: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.payment.create({
        data: {
          organizationId: organization.id,
          pricingId: planId,
          amount,
          currency,
          status: PaymentStatus.SUCCEEDED,
          paymentProvider: "checkout",
          providerPaymentId: `checkout_${organization.id}_${Date.now()}`,
          billingPeriodStart,
          billingPeriodEnd,
        },
      });

      return user;
    });

    return createdUser;
  } catch (err) {
    throw new AppError("Transaction Failed", 500);
  }
};

export const completeRegistrationService = async ({
  userId,
  businessName,
  planId,
}: {
  userId: string;
  businessName: string;
  planId: string;
}) => {
  // export const completeRegistrationService = async ({ userId, businessName, planId, amount, currency, isAnnual }: { userId: string; businessName: string; planId: string; amount: number; currency: string; isAnnual: boolean }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);
  if (!user.isEmailVerified) throw new AppError("Email not verified", 403);

  const widgetSecret = await generateSecret(32);
  const orgSlug = slugify(businessName);

  // const periodDays = isAnnual ? 365 : 30;
  // const billingPeriodStart = new Date();
  // const billingPeriodEnd = new Date(billingPeriodStart.getTime() + periodDays * 24 * 60 * 60 * 1000);
  let createdOrgId: string | undefined = "";
  await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: businessName,
        slug: orgSlug,
        email: user.email,
        widgetSecret,
        isActive: true,
        planId,
      },
    });
    createdOrgId = org.id;

    await tx.user.update({
      where: { id: userId },
      data: { organizationId: org.id },
    });

    // await tx.payment.create({
    // 	data: {
    // 		organizationId: org.id,
    // 		pricingId: planId,
    // 		amount,
    // 		currency,
    // 		status: PaymentStatus.SUCCEEDED,
    // 		paymentProvider: "checkout",
    // 		providerPaymentId: `checkout_${org.id}_${Date.now()}`,
    // 		billingPeriodStart,
    // 		billingPeriodEnd,
    // 	},
    // });
  });

  await enqueueNotification("organization_registered", {
    organizationId: createdOrgId!,
    organizationName: businessName,
  });

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      organizationId: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  });
};

export const loginService = async ({
  email,
  password,
}: LoginInput): Promise<OraganizationDataDTO> => {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      throw new AppError("Wrong Email or Password", 401);
    }

    const passwordCheck = await comparePassword(password, user.passwordHash);
    if (!passwordCheck) {
      throw new AppError("Wrong Email or Password", 401);
    }

    if (!user.isEmailVerified) {
      const err = new AppError("EMAIL_NOT_VERIFIED", 403) as AppError & {
        userId: string;
      };
      err.userId = user.id;
      throw err;
    }

    const { passwordHash: _password, ...dataDTO } = user;

    return dataDTO;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export async function hasActiveSubscription(
  organizationId: string | null,
): Promise<boolean> {
  if (!organizationId) return false;
  const active = await prisma.payment.findFirst({
    where: {
      organizationId,
      status: PaymentStatus.SUCCEEDED,
      billingPeriodEnd: { gt: new Date() },
    },
  });
  return Boolean(active);
}

export const userService = async (
  payloadToken: TokenPayload,
): Promise<userData> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: payloadToken.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        organization: { select: { name: true, planId: true } },
      },
    });

    if (!user) {
      throw new AppError("User not found!", 401);
    }

    const activeSubscription = await hasActiveSubscription(user.organizationId);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId,
      orgName: user.organization?.name ?? null,
      currentPlanId: user.organization?.planId ?? null,
      onboarded: Boolean(user.organizationId),
      hasActiveSubscription: activeSubscription,
    };
  } catch (err) {
    throw err;
  }
};

export async function validateApiKey(rawKey: string, origin?: string) {
  const incomingApiKey = rawKey;

  const clientHash = hashApiKey(incomingApiKey as string);

  const apiKeyRecord = await prisma.apiKey.findUnique({
    where: {
      keyHash: clientHash,
    },
    include: { organization: true },
  });

  if (!apiKeyRecord || !apiKeyRecord.isActive) {
    return null;
  }

  if (origin && !apiKeyRecord.allowedOrigins.includes(origin)) {
    return null;
  }

  await prisma.apiKey.update({
    where: {
      id: apiKeyRecord.id,
    },
    data: {
      lastUsedAt: new Date(),
    },
  });

  return apiKeyRecord;
}

export async function verifyCustomerJWT(token: string, organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { widgetSecret: true },
  });

  if (!org) return null;

  try {
    const payload = jwt.verify(token, org.widgetSecret) as any;
    return {
      externalId: payload.sub,
      email: payload.email,
      name: payload.name,
      metadata: payload,
    };
  } catch {
    return null;
  }
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(idToken: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new AppError("Invalid Google token", 401);
  }
  return { email: payload.email.trim().toLowerCase(), name: payload.name };
}

export const loginWithGoogleService = async (
  email: string,
): Promise<OraganizationDataDTO> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError("Wrong Email or Password", 401);
  }
  const { passwordHash: _password, ...dataDTO } = user;
  return dataDTO;
};

export async function sendVerificationService(
  userId: string,
  email: string,
): Promise<void> {
  await prisma.emailVerification.deleteMany({ where: { userId } });

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.emailVerification.create({
    data: { userId, email, code, expiresAt },
  });

  await sendVerificationEmail(email, code);
}

export async function verifyEmailService(
  userId: string,
  code: string,
): Promise<void> {
  const record = await prisma.emailVerification.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!record) throw new AppError("No verification code found", 404);
  if (record.expiresAt < new Date())
    throw new AppError("Code has expired", 410);
  if (record.code !== code) throw new AppError("Invalid code", 400);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true, emailVerifiedAt: new Date() },
    }),
    prisma.emailVerification.deleteMany({ where: { userId } }),
  ]);
}

export async function getUnverifiedUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, isEmailVerified: true },
  });
}

export async function forgotPasswordService(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // always return success even if email not found — prevents email enumeration
  if (!user) return;

  // invalidate any existing unused tokens for this user
  await prisma.passwordReset.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  sendPasswordResetEmail(normalizedEmail, resetUrl).catch(console.error);
}

export async function resetPasswordService(
  token: string,
  newPassword: string,
): Promise<void> {
  const record = await prisma.passwordReset.findUnique({
    where: { token },
  });

  if (!record) throw new AppError("Invalid or expired reset link", 400);
  if (record.used)
    throw new AppError("This reset link has already been used", 400);
  if (record.expiresAt < new Date())
    throw new AppError("This reset link has expired", 410);

  if (newPassword.length < 8)
    throw new AppError("Password must be at least 8 characters", 400);

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordReset.update({
      where: { token },
      data: { used: true },
    }),
  ]);
}

export const registerWithGoogleService = async (
  email: string,
  name?: string,
): Promise<{ userId: string; email: string; isNewUser: boolean }> => {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing && existing.isEmailVerified) {
    return { userId: existing.id, email, isNewUser: false };
  }

  const nameParts = (name ?? "").trim().split(" ");
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") ?? "";

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: "",
      role: Role.ORG_ADMIN,
      firstName,
      lastName,
      isActive: true,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
    select: { id: true, email: true },
  });

  return { userId: user.id, email, isNewUser: true };
};
