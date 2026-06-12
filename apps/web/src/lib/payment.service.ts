// ── Types ──────────────────────────────────────────────────────────────────────

export interface CreateIntentionParams {
  pricingId: string;
  amountCents: number;
  currency?: string;
  billingData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export interface CreateIntentionResult {
  success: boolean;
  clientSecret?: string;
  intentionId?: string;
  paymentId?: string;
  error?: string;
}

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  paymentProvider: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  createdAt: string;
  pricing: {
    name: string;
    priceMonthly: number;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

// ── POST /payments/intention ───────────────────────────────────────────────────

export async function createPaymentIntention(
  params: CreateIntentionParams,
): Promise<CreateIntentionResult> {
  try {
    const res = await fetch(`${API_BASE}/payments/create-intention`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pricingId: params.pricingId,
        amountCents: params.amountCents,
        currency: params.currency ?? "EGP",
        billingData: params.billingData,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err.error ?? `Request failed (${res.status}).`,
      };
    }

    const data = await res.json();

    return {
      success: true,
      clientSecret: data.clientSecret,
      intentionId: data.intentionId?.toString(),
      paymentId: data.paymentId,
    };
  } catch {
    return {
      success: false,
      error:
        "Could not reach the payment server. Please check your connection.",
    };
  }
}

// ── GET /payments/history ──────────────────────────────────────────────────────

export async function getPaymentHistory(): Promise<PaymentHistoryItem[]> {
  const res = await fetch(`${API_BASE}/payments/history`, {});

  if (!res.ok)
    throw new Error(`Failed to fetch payment history (${res.status})`);

  return res.json();
}

// ── Paymob hosted checkout URL ─────────────────────────────────────────────────
// After createPaymentIntention returns clientSecret, open this URL in the iframe.
// Paymob renders its own UI; your backend webhook handles the DB update.

export function buildPaymobCheckoutUrl(clientSecret: string): string {
  const publicKey = process.env.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY ?? "";
  return `https://accept.paymob.com/unifiedcheckout/?publicKey=${publicKey}&clientSecret=${clientSecret}`;
}
