import type { Request, Response } from "express";
import {
	createPaymentIntentionService,
	getPaymentHistoryService,
	handleWebhookService,
} from "src/services/payment.service.js";
import type { AuthenticatedRequest } from "src/types/auth.types.js";

export const createPaymentIntentionController = async (
	req: AuthenticatedRequest,
	res: Response,
) => {
	try {
		const organizationId = req.user?.organizationId;
		const { pricingId, amountCents, currency, billingData } = req.body;

		if (!organizationId || !pricingId || !amountCents || !billingData) {
			return res.status(400).json({ error: "Missing required fields" });
		}

		const result = await createPaymentIntentionService({
			organizationId,
			pricingId,
			amountCents,
			currency: currency || "EGP",
			billingData,
		});

		return res.status(201).json(result);
	} catch (error: any) {
		if (error.status)
			return res.status(error.status).json({ error: error.message });
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
		// Still return 200 to stop Paymob from retrying on auth failures
		return res.status(200).json({ received: true });
	}
};

export const getPaymentHistoryController = async (
	req: AuthenticatedRequest,
	res: Response,
) => {
	try {
		const organizationId = req.user?.organizationId;
		const payments = await getPaymentHistoryService(organizationId as string);
		return res.status(200).json(payments);
	} catch (error: any) {
		if (error.status)
			return res.status(error.status).json({ error: error.message });
		return res.status(500).json({ error: "Internal server error" });
	}
};
