import { PaymentStatus } from "generated/prisma/enums.js";
import crypto from "crypto";
import prisma from "src/config/prisma.js";
import AppError from "src/utils/appError.js";

const PAYMOB_SECRET_KEY = process.env.PAYMOB_SECRET_KEY as string;
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET as string;
const PAYMOB_API_BASE = process.env.PAYMOB_API_BASE;

// ─── HMAC Verification ─────────────────────────────────────────────────────────
// Paymob signs webhook payloads with HMAC-SHA512
// You must verify this before trusting any webhook data

function verifyHmac(body: any, hmacHeader: string): boolean {
  try {
    const obj = body.obj || {};

    // Paymob concatenates specific fields in this exact order
    const hmacString = [
      obj.amount_cents,
      obj.created_at,
      obj.currency,
      obj.error_occured,
      obj.has_parent_transaction,
      obj.id,
      obj.integration_id,
      obj.is_3d_secure,
      obj.is_auth,
      obj.is_capture,
      obj.is_refunded,
      obj.is_standalone_payment,
      obj.is_voided,
      obj.order?.id,
      obj.owner,
      obj.pending,
      obj.source_data?.pan,
      obj.source_data?.sub_type,
      obj.source_data?.type,
      obj.success,
    ].join("");

    const computedHmac = crypto
      .createHmac("sha512", PAYMOB_HMAC_SECRET)
      .update(hmacString)
      .digest("hex");

    return computedHmac === hmacHeader;
  } catch (err) {
    console.error("HMAC computation error:", err);
    return false;
  }
}

interface CreateIntentionInput {
  organizationId: string;
  pricingId: string;
  amountCents: number; // amount in cents e.g. 50000 = 500 EGP
  currency: string; // 'EGP'
  billingData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export const createPaymentIntentionService = async ({
  organizationId,
  pricingId,
  amountCents,
  currency,
  billingData,
}: CreateIntentionInput) => {
  // 1. Verify org exists
  const org = await prisma.organization.findUnique({
    where: { id: organizationId, isActive: true },
  });

  if (!org) throw new AppError("Organization not found", 404);

  // 2. Verify plan exists
  const pricing = await prisma.pricing.findFirst({
    where: { id: pricingId, isActive: true },
  });

  if (!pricing) throw new AppError("Pricing plan not found", 404);

  // 3. Create intention on Paymob
  const response = await fetch(`${PAYMOB_API_BASE}/intention/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${PAYMOB_SECRET_KEY}`,
    },
    body: JSON.stringify({
      amount: amountCents,
      currency,
      payment_methods: [5707832, 5707790],
      items: [
        {
          name: pricing.name,
          amount: amountCents,
          description: `SupportNest ${pricing.name} Plan`,
          quantity: 1,
        },
      ],
      billing_data: {
        first_name: billingData.firstName,
        last_name: billingData.lastName,
        email: billingData.email,
        phone_number: billingData.phone,
      },
      // Pass your internal IDs so you can match on webhook
      extras: {
        organizationId,
        pricingId,
      },
    }),
  });
  console.log(response);
  const intention: any = await response.json();

  if (!response.ok) {
    console.error("Paymob intention error:", intention);
    throw new AppError("Failed to create payment intention", 502);
  }

  // 4. Save a pending payment record
  const payment = await prisma.payment.create({
    data: {
      organizationId,
      pricingId,
      amount: amountCents / 100, // store in base currency
      currency,
      status: PaymentStatus.PENDING,
      paymentProvider: "paymob",
      providerPaymentId: intention.id?.toString() || "",
      billingPeriodStart: new Date(),
      billingPeriodEnd: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000, // +30 days
      ),
    },
  });

  return {
    clientSecret: intention.client_secret,
    intentionId: intention.id,
    paymentId: payment.id,
    amount: amountCents,
    currency,
  };
};

// ─── Handle Webhook ────────────────────────────────────────────────────────────
// Paymob calls this after payment is completed, failed, or refunded
// Must verify HMAC signature to confirm it's really from Paymob

export const handleWebhookService = async (body: any, hmacHeader: string) => {
  // 1. Verify HMAC signature — security critical
  const isValid = verifyHmac(body, hmacHeader);

  if (!isValid) {
    console.error("Webhook HMAC verification failed");
    throw new AppError("Invalid HMAC signature", 401);
  }

  const transaction = body.obj;
  const success = body.obj?.success;
  const pending = body.obj?.pending;
  const intentionId = body.obj?.payment_key_claims?.extra?.intention_id;
  const organizationId =
    body.obj?.payment_key_claims?.extra?.extras?.organizationId;
  const pricingId = body.obj?.payment_key_claims?.extra?.extras?.pricingId;
  const transactionId = body.obj?.id?.toString();
  const amountCents = body.obj?.amount_cents;

  console.log("Webhook received:", {
    transactionId,
    success,
    pending,
    organizationId,
    pricingId,
  });

  // 2. Find the pending payment record
  const payment = await prisma.payment.findFirst({
    where: {
      organizationId,
      status: PaymentStatus.PENDING,
      paymentProvider: "paymob",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!payment) {
    console.error("No pending payment found for org:", organizationId);
    return { received: true }; // return 200 to Paymob so it stops retrying
  }

  // 3. Handle based on transaction result
  if (success && !pending) {
    // ── Payment succeeded ──
    await prisma.$transaction([
      // Update payment status
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCEEDED,
          providerPaymentId: transactionId || payment.providerPaymentId,
        },
      }),
      // Update org plan
      prisma.organization.update({
        where: { id: organizationId },
        data: { planId: pricingId },
      }),
    ]);
    console.log("Payment succeeded for org:", organizationId);
  } else if (!success && !pending) {
    // ── Payment failed ──
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        providerPaymentId: transactionId || payment.providerPaymentId,
      },
    });

    console.log("Payment failed for org:", organizationId);
  } else if (pending) {
    // ── Payment pending (e.g. cash collection, kiosk) ──
    console.log("Payment pending for org:", organizationId);
  }

  return { received: true };
};

// ─── Get Payment History ───────────────────────────────────────────────────────

export const getPaymentHistoryService = async (
  organizationId: string,
): Promise<any> => {
  const payments = await prisma.payment.findMany({
    where: { organizationId },
    include: {
      pricing: {
        select: { name: true, priceMonthly: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return payments;
};
