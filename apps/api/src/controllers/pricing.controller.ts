import type { Request, Response } from "express";
import { getActivePlansService } from "src/services/pricing.service.js";

export const getActivePlans = async (req: Request, res: Response) => {
	try {
		const plans = await getActivePlansService();
		return res.status(200).json(plans);
	} catch (error: any) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error" });
	}
};
