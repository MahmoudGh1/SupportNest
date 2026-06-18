import type { PricingPlan } from "@/types/types";
import { apiFetch } from "./client";
import { BASE_URL } from "./client";

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

export async function getPlans(): Promise<PricingPlan[]> {
	const res = await fetch(`${BASE_URL}/pricing`, { credentials: "include" });
	const data = await res.json();
	if (!res.ok) throw new Error(data.error ?? "Failed to load plans");
	return data;
}

export async function createPaymentIntention(data: {
	pricingId: string;
	amountCents: number;
	currency?: string;
	billingData: {
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
	};
}): Promise<{
	clientSecret: string;
	intentionId: string;
	paymentId: string;
	amount: number;
	currency: string;
}> {
	const body = await apiFetch<{
		clientSecret: string;
		intentionId: string;
		paymentId: string;
		amount: number;
		currency: string;
	}>("/payments/create-intention", {
		method: "POST",
		body: JSON.stringify(data),
	});
	sessionStorage.setItem("paymentId", body?.paymentId);
	return body;
}

export async function completePayment(data: { pricingId: string; amount: number; currency?: string; isAnnual: boolean }): Promise<{ paymentId: string; billingPeriodEnd: string }> {
	return apiFetch("/payments/complete", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function confirmPayment(paymentId: string): Promise<{ ok: boolean }> {
	return apiFetch("/payments/confirm", {
		method: "POST",
		body: JSON.stringify({ paymentId }),
	});
}

export async function getPaymentHistory(): Promise<Array<{ id: string; status: string }>> {
	const data = await apiFetch<unknown[]>("/payments/history");
	if (!Array.isArray(data)) return [];
	return data.map((item) => ({
		id: String((item as Record<string, unknown>).id ?? ""),
		status: String((item as Record<string, unknown>).status ?? ""),
	}));
}
