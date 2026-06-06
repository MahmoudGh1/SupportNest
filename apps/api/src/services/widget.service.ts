import jwt from "jsonwebtoken";
import prisma from "src/config/prisma.js";
import AppError from "src/utils/appError.js";
import { hashApiKey } from "src/utils/crypto.utils.js";

export const widgetInitService = async ({
  rawApiKey,
  origin,
  customerToken,
}: {
  rawApiKey: string;
  origin: string;
  customerToken?: string;
}) => {
  // ── 1. Find API key by prefix (fast lookup)
  const prefix = rawApiKey.slice(0, 8);

  const candidates = await prisma.apiKey.findMany({
    where: { keyPrefix: prefix, isActive: true },
    include: { organization: true },
  });

  if (!candidates.length) {
    throw new AppError("Invalid API key", 401);
  }

  // ── 2. Hash compare to find exact match
  const rawHash = hashApiKey(rawApiKey);
  const matchedKey = candidates.find(
    (candidate) => candidate.keyHash === rawHash,
  );

  if (!matchedKey) {
    throw new AppError("Invalid API key", 401);
  }

  const org = matchedKey.organization;

  // ── 3. Origin validation
  // Only check if org has configured allowed origins
  // if (matchedKey.allowedOrigins.length > 0) {
  //   const isAllowed = matchedKey.allowedOrigins.some(
  //     (allowed) => origin === allowed || origin?.startsWith(allowed),
  //   );

  //   if (!isAllowed) {
  //     throw new AppError("Origin not allowed", 403);
  //   }
  // }

  // ── 4. Update last used
  await prisma.apiKey.update({
    where: { id: matchedKey.id },
    data: { lastUsedAt: new Date() },
  });

  // ── 5. Identify or create customer
  let customer;

  if (customerToken) {
    // Business provided a signed JWT identifying their logged-in customer
    try {
      const payload = jwt.verify(
        customerToken,
        org.widgetSecret, // org's own secret — they signed this JWT
      ) as any;

      // Find or create identified customer
      customer = await prisma.customer.upsert({
        where: {
          organizationId_externalId: {
            organizationId: org.id,
            externalId: payload.sub || payload.userId,
          },
        },
        update: {
          email: payload.email,
          name: payload.name,
          metadata: payload,
        },
        create: {
          organizationId: org.id,
          externalId: payload.sub || payload.userId,
          email: payload.email || null,
          name: payload.name || null,
          metadata: payload,
          isAnonymous: false,
        },
      });
    } catch (err) {
      // Invalid customer token — treat as anonymous
      customer = await prisma.customer.create({
        data: {
          organizationId: org.id,
          isAnonymous: true,
        },
      });
    }
  } else {
    // No customer token — anonymous visitor
    customer = await prisma.customer.create({
      data: {
        organizationId: org.id,
        isAnonymous: true,
      },
    });
  }

  // ── 6. Issue short-lived session token
  const sessionToken = jwt.sign(
    {
      customerId: customer.id,
      organizationId: org.id,
      apiKeyId: matchedKey.id,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "4h" }, // widget sessions expire in 4 hours
  );

  // ── 7. Return everything the widget needs
  // Ensure widgetConfig (from a Json field) is an object before accessing properties
  const widgetConf =
    typeof org.widgetConfig === "object" && org.widgetConfig
      ? (org.widgetConfig as Record<string, any>)
      : {};

  return {
    sessionToken,
    customer: {
      id: customer.id,
      name: customer.name,
      isAnonymous: customer.isAnonymous,
    },
    widgetConfig: {
      title: widgetConf.title || "Support",
      greetingMessage: widgetConf.greetingMessage || "Hi! How can we help you?",
      accentColor: widgetConf.accentColor || "#6366f1",
      placeholder: widgetConf.placeholder || "Type a message...",
    },
  };
};
