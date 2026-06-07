import { ConversationStatus } from "generated/prisma/enums.js";
import prisma from "src/config/prisma.js";

export async function upsertCustomer({ organizationId, customerData }) {
	if (!customerData) {
		return prisma.customer.create({
			data: { organizationId, isAnonymous: true },
		});
	}

	return prisma.customer.upsert({
		where: {
			organizationId_externalId: {
				organizationId,
				externalId: customerData.externalId,
			},
		},
		update: { email: customerData.email, name: customerData.name },
		create: {
			organizationId,
			externalId: customerData.externalId,
			email: customerData.email,
			name: customerData.name,
			isAnonymous: false,
		},
	});
}

export async function getOrCreateConversation({
	organizationId,
	customerId,
	apiKeyId,
}) {
	// Resume existing active conversation if any
	const existing = await prisma.conversation.findFirst({
		where: { customerId, conversationStatus: ConversationStatus.ACTIVE },
		orderBy: { createdAt: "desc" },
	});

	if (existing) return existing;

	return prisma.conversation.create({
		data: {
			organizationId,
			customerId,
			apiKeyId,
			conversationStatus: ConversationStatus.ACTIVE,
		},
	});
}
