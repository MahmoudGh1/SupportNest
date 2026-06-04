import crypto from "crypto";
import bcrypt from "bcrypt";
import prisma from "src/config/prisma.js";
import { Role } from "generated/prisma/enums.js";

/**
 * Converts a business name into a URL-friendly slug.
 *
 * @param name - The original business name.
 * @returns The slugified string.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

interface RegisterInput {
  businessName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  planId: string;
}

/**
 * Registers a new organization, user, and API key in a single transaction.
 *
 * @param params - Registration payload.
 * @param params.businessName - The name of the organization.
 * @param params.email - The email address for the new admin user.
 * @param params.password - The password for the new admin user.
 * @param params.firstName - The first name of the new admin user.
 * @param params.lastName - The last name of the new admin user.
 * @param params.planId - The plan selected for the organization.
 * @returns An object containing the generated API key and organization details.
 * @throws If the email is already registered.
 */
export const registerService = async ({
  businessName,
  email,
  password,
  firstName,
  lastName,
  planId,
}: RegisterInput) => {
  // 1. Check email not already taken
  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    throw { status: 409, message: "Email already registered" };
  }

  // 2. Run everything in a transaction
  const { user, org, rawApiKey } = await prisma.$transaction(
    async (tx: any) => {
      const org = await tx.organization.create({
        data: {
          name: businessName,
          slug: slugify(businessName),
          email,
          widgetSecret: crypto.randomBytes(32).toString("hex"),
          isActive: true,
          planId: planId,
        },
      });

      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          email,
          passwordHash: await bcrypt.hash(password, 12),
          role: Role.ORG_ADMIN,
          firstName: firstName,
          lastName: lastName,
          isActive: true,
        },
      });

      const rawKey = "sk_" + crypto.randomBytes(24).toString("hex");
      await tx.apiKey.create({
        data: {
          organizationId: org.id,
          keyHash: await bcrypt.hash(rawKey, 10),
          keyPrefix: rawKey.slice(0, 8),
          name: "Default",
          allowedOrigins: [],
          isActive: true,
        },
      });

      return { user, org, rawApiKey: rawKey };
    },
  );

  return {
    apiKey: rawApiKey,
    organization: { id: org.id, name: org.name, slug: org.slug },
  };
};
