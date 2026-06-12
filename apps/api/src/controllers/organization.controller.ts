import type { Response } from "express";
import { getMyOrgService, updateOrgProfileService, updateWidgetConfigService } from "src/services/organization.service.js";
import type { AuthenticatedRequest } from "src/types/auth.types.js";

export const getMyOrgController = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const organizationId = req.user?.organizationId;
		const org = await getMyOrgService(organizationId as string);
		return res.status(200).json(org);
	} catch (error: any) {
		if (error.status) return res.status(error.status).json({ error: error.message });
		console.error(error);
		return res.status(500).json({ error: "Internal server error" });
	}
};

export const updateWidgetConfigController = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const organizationId = req.user?.organizationId;
		const { title, greetingMessage, accentColor, placeholder } = req.body;

		const result = await updateWidgetConfigService(organizationId as string, {
			title,
			greetingMessage,
			accentColor,
			placeholder,
		});

		return res.status(200).json(result);
	} catch (error: any) {
		if (error.status) return res.status(error.status).json({ error: error.message });
		console.error(error);
		return res.status(500).json({ error: "Internal server error" });
	}
};

export const updateOrgProfileController = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const organizationId = req.user?.organizationId;
		const { name, email } = req.body;

		const result = await updateOrgProfileService(organizationId as string, {
			name,
			email,
		});
		return res.status(200).json(result);
	} catch (error: any) {
		if (error.status) return res.status(error.status).json({ error: error.message });
		console.error(error);
		return res.status(500).json({ error: "Internal server error" });
	}
};

// export const getOrgStats = async (req: Request, res: Response) => {
//   try {
//     const { organizationId } = req.user;
//     const stats = await getOrgStatsService(organizationId);
//     return res.status(200).json(stats);
//   } catch (error: any) {
//     if (error.status) return res.status(error.status).json({ error: error.message });
//     console.error(error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// };
