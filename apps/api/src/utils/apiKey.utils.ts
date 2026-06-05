import prisma from "src/config/prisma.js";
import { generateSecret, hashPassword } from "./password.util.js";

export default async function apiKey(organization: any, allowedOrigins: any) {
  const apiSecret = "sk_" + (await generateSecret(24));
  const apiKey = await prisma.apiKey.create({
    data: {
      organizationId: organization.id,
      keyHash: await hashPassword(apiSecret),
      keyPrefix: apiSecret.slice(0, 8),
      name: "Default",
      allowedOrigins: allowedOrigins,
      isActive: true,
    },
  });
  return { apiKey, apiSecret };
}
