import prisma from "src/config/prisma.js";
import AppError from "src/utils/appError.js";

// ─── Get My Organization

export const getMyOrgService = async (organizationId: string) => {
	const org = await prisma.organization.findUnique({
		where: { id: organizationId, isActive: true },
		select: {
			id: true,
			name: true,
			slug: true,
			email: true,
			widgetConfig: true,
			isActive: true,
			createdAt: true,
			updatedAt: true,
			planId: true,
			// widgetSecret NEVER selected
		},
	});

	if (!org) throw new AppError("Organization not found", 404);

	return org;
};

// ─── Update Widget Config

export const updateWidgetConfigService = async (
	organizationId: string,
	widgetConfig: {
		title?: string;
		greetingMessage?: string;
		accentColor?: string;
		placeholder?: string;
	},
) => {
	// Validate accent color format if provided
	if (widgetConfig.accentColor) {
		const isValidHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(
			widgetConfig.accentColor,
		);
		if (!isValidHex) {
			throw new AppError(
				"accentColor must be a valid hex color e.g. #6366f1",
				400,
			);
		}
	}

	const org = await prisma.organization.update({
		where: { id: organizationId },
		data: { widgetConfig },
		select: {
			id: true,
			name: true,
			widgetConfig: true,
			// widgetSecret NEVER selected
		},
	});

	return org;
};

// ─── Update Organization Profile

export const updateOrgProfileService = async (
	organizationId: string,
	data: {
		name?: string;
		email?: string;
	},
) => {
	if (!data.name && !data.email) {
		throw new AppError("Nothing to update", 400);
	}

	const org = await prisma.organization.update({
		where: { id: organizationId },
		data: {
			...(data.name && { name: data.name }),
			...(data.email && { email: data.email }),
		},
		select: {
			id: true,
			name: true,
			slug: true,
			email: true,
			widgetConfig: true,
			updatedAt: true,
		},
	});

	return org;
};

// ─── Get Organization Stats (for dashboard home)

// export const getOrgStatsService = async (organizationId: string) => {
//   const [
//     totalConversations,
//     activeConversations,
//     escalatedConversations,
//     openTickets,
//     totalDocuments
//   ] = await Promise.all([
//     prisma.conversation.count({
//       where: { organizationId }
//     }),
//     prisma.conversation.count({
//       where: { organizationId, conversationStatus: 'active' }
//     }),
//     prisma.conversation.count({
//       where: { organizationId, conversationStatus: 'escalated' }
//     }),
//     prisma.ticket.count({
//       where: { organizationId, status: 'open' }
//     }),
//     prisma.knowledgeDocument.count({
//       where: { organizationId, status: 'ready' }
//     })
//   ]);

//   return {
//     totalConversations,
//     activeConversations,
//     escalatedConversations,
//     openTickets,
//     totalDocuments
//   };
// };
