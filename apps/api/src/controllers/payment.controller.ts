import type { Request, Response } from "express";
import { completeCheckoutService, confirmPaymentService, createPaymentIntentionService, getPaymentHistoryService, getPaymentStatusService, handleWebhookService } from "src/services/payment.service.js";
import type { AuthenticatedRequest } from "src/types/auth.types.js";
import AppError from "src/utils/appError.js";

export const createPaymentIntentionController = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const organizationId = req.user?.organizationId;
		const { userId, pricingId, amountCents, currency, billingData } = req.body;

		if (!userId || !pricingId || !amountCents || !billingData) {
			return res.status(400).json({ error: "Missing required fields" });
		}

		const result = await createPaymentIntentionService({
			userId,
			// organizationId,
			pricingId,
			amountCents,
			currency: currency || "EGP",
			billingData,
		});

		return res.status(201).json(result);
	} catch (error: unknown) {
		if (error instanceof AppError) {
			return res.status(error.statusCode).json({ error: error.message });
		}
		return res.status(500).json({ error: "Internal server error" });
	}
};

export const completeCheckoutController = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const organizationId = req.user?.organizationId;
		const { pricingId, amount, currency, isAnnual } = req.body;

		if (!organizationId || !pricingId || amount == null) {
			return res.status(400).json({ error: "Missing required fields" });
		}

		const result = await completeCheckoutService({
			organizationId,
			pricingId,
			amount: Number(amount),
			currency: currency || "EGP",
			isAnnual: Boolean(isAnnual),
		});

		return res.status(200).json(result);
	} catch (error: unknown) {
		if (error instanceof AppError) {
			return res.status(error.statusCode).json({ error: error.message });
		}
		return res.status(500).json({ error: "Internal server error" });
	}
};

// Webhook — no auth middleware, Paymob calls this directly
// Security is handled by HMAC verification inside the service
export const handleWebhookController = async (req: Request, res: Response) => {
	try {
		const hmacHeader = req.query.hmac as string;

		const result = await handleWebhookService(req.body, hmacHeader);

		// Always return 200 quickly — Paymob retries if it doesn't get 200
		return res.status(200).json(result);
	} catch (error: any) {
		console.error("[handleWebhookController] error:", error);
		return res.status(200).json({ received: true });
	}
};

export const getPaymentHistoryController = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const organizationId = req.user?.organizationId;
		const payments = await getPaymentHistoryService(organizationId as string);
		return res.status(200).json(payments);
	} catch (error: unknown) {
		if (error instanceof AppError) {
			return res.status(error.statusCode).json({ error: error.message });
		}
		return res.status(500).json({ error: "Internal server error" });
	}
};

export async function confirmPaymentController(req: Request, res: Response) {
	try {
		const { paymentId } = req.body;
		const result = await confirmPaymentService(paymentId);
		return res.json(result);
	} catch (err: any) {
		if (err.message === "PAYMENT_NOT_FOUND") {
			return res.status(404).json({ error: "Payment not found" });
		}
		return res.status(500).json({ error: "Failed to confirm payment" });
	}
}

export const getPaymentStatusController = async (req: Request, res: Response) => {
	try {
		const { paymentId } = req.params;
		const status = await getPaymentStatusService(paymentId);
		return res.status(200).json({ status });
	} catch (error: unknown) {
		if (error instanceof AppError) return res.status(error.statusCode).json({ error: error.message });
		return res.status(500).json({ error: "Internal server error" });
	}
};
