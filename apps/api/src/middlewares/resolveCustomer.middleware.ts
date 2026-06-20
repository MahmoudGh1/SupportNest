import resolveCustomerFromRequest from "src/services/resolveCustomerFromRequest.service.js";
import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedWidgetRequest } from "src/types/apiKey.types.js";

export async function resolveCustomer(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const authReq = req as AuthenticatedWidgetRequest;

		const customer = await resolveCustomerFromRequest({
			organizationId: authReq.organization.id,
			widgetSecret: authReq.organization.widgetSecret,
			customerJwt: authReq.body.customerJwt,
			visitorId: authReq.body.visitorId,
		}); // <- same shared function the WebSocket auth handler should also call
		authReq.customer = customer;
		next();
	} catch (err: any) {
		res.status(401).json({ message: err.message });
	}
}
