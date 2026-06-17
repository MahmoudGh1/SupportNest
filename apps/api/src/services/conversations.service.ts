import {
	ConversationStatus,
	MessageRole,
	MessageTier,
	ResolutionTier,
} from "generated/prisma/enums.js";
import { runRouter } from "src/agents/router.agent.js";
import prisma from "src/config/prisma.js";
import type {
	ConversationMessage,
	PipelineContext,
	RouterOutput,
} from "src/types/agent.types.js";
import type {
	processPipelineTurnInput,
	processPipelineTurnOutput,
	startConversationInput,
} from "src/types/conversation.types.js";
import {
	appendToMemory,
	loadMemory,
} from "src/utils/conversationMemory.utils.js";
import { verifyToken } from "src/utils/jwt.util.js";
import type { Organization } from "generated/prisma/client.js";
import { conversationCloseQueue } from "src/queues/conversationCloseQueue.js";

export async function startConversation({
	organizationId,
	customerId,
	apiKeyId,
}: startConversationInput) {
	console.log("start conversation");
	// Resume existing active conversation if any
	const existing = await prisma.conversation.findFirst({
		where: { customerId, conversationStatus: ConversationStatus.ACTIVE },
		orderBy: { createdAt: "desc" },
	});

	if (existing) return existing;

	const conversation = await prisma.conversation.create({
		data: {
			organizationId: organizationId,
			customerId: customerId,
			apiKeyId: apiKeyId as string,
			conversationStatus: ConversationStatus.ACTIVE,
			closedAt: null,
		},
	});
	return conversation;
}

export async function upsertCustomer({
	organization,
	customerToken,
}: {
	organization: Pick<Organization, "id" | "widgetSecret">;
	customerToken: string | null | undefined;
}) {
	let customer = null;

	if (customerToken) {
		const {
			sub,
			email = "",
			name = "",
			...claims
		} = verifyToken(customerToken, organization.widgetSecret);

		customer = await prisma.customer.upsert({
			where: {
				organizationId_externalId: {
					organizationId: organization.id,
					externalId: sub,
				},
			},
			update: {
				name: name as string,
				email: email as string,
				isAnonymous: false,
				metadata: {
					// This automatically performs: existing_metadata || claims
					// It overwrites matching keys and adds new ones
					set: claims,
				},
			},
			create: {
				organizationId: organization.id,
				externalId: sub,
				name: name as string,
				email: email as string,
				isAnonymous: true,
				metadata: claims,
			},
		});
	} else {
		customer = await prisma.customer.create({
			data: {
				organizationId: organization.id,
				externalId: null,
				name: null,
				email: null,
			},
		});
	}

	return customer;
}

// export async function sendMessage({
// 	conversationId,
// 	organizationId,
// 	latestMessage,
// 	apiKeyId,
// }) {
// const conversation = await prisma.conversation.findUnique({
// 	where: {
// 		id: conversationId as string,
// 		organizationId,
// 		apiKeyId,
// 	},
// });
// if (!conversation) {
// 	throw new AppError("conversation not found", 400);
// }
// if (conversation.apiKeyId !== apiKeyId) {
// 	throw new AppError(
// 		"conversation doesn't belong to the current organization",
// 	);
// }
// if (conversation.conversationStatus === ConversationStatus.CLOSED) {
// 	throw new AppError("conversation is already closed");
// }
// const customerMessage = await prisma.message.create({
// 	data: {
// 		conversationId: conversation.id,
// 		role: MessageRole.CUSTOMER,
// 		content: latestMessage,
// 	},
// });
// const conversationHistory = await prisma.message.findMany({
// 	where: {
// 		conversationId: conversation.id,
// 	},
// });
// }

export async function processPipelineTurn({
	conversationId,
	organizationId,
	customerId,
	content,
}: processPipelineTurnInput): Promise<processPipelineTurnOutput> {
	// saves customer message
	await prisma.message.create({
		data: {
			conversationId,
			role: MessageRole.CUSTOMER,
			content,
		},
	});

	// loads Redis memory
	const redisHistory = await loadMemory(conversationId);

	// run the router
	const context: PipelineContext = {
		customerId,
		conversationId,
		organizationId,
		latestMessage: content,
		conversationHistory: redisHistory as ConversationMessage[],
	};

	const routerOutput = await runRouter(context);

	// saves AI message
	const aiMessage = await prisma.message.create({
		data: {
			conversationId,
			role: "AI",
			content: routerOutput.finalResponse,
			tier:
				routerOutput.resolvedByTier === "HUMAN"
					? null
					: routerOutput.resolvedByTier,
		},
	});
	// appends to Redis memory
	await appendToMemory(conversationId, content, routerOutput.finalResponse);

	// --- inactivity close rescheduling ---
	// every turn pushes the auto-close timer forward; if one is already
	// pending for this conversation, remove it before adding the new one
	const closeJobId = `close-${conversationId}`;
	const existingCloseJob = await conversationCloseQueue.getJob(closeJobId);
	if (existingCloseJob) {
		await existingCloseJob.remove();
	}

	await conversationCloseQueue.add(
		"close-conversation",
		{ conversationId, organizationId },
		{
			jobId: closeJobId,
			delay: Number(process.env.CONVERSATION_INACTIVITY_TIMEOUT_MS) || 600000, // 10 min default
		},
	);
	console.log(
		`[close-queue] scheduled close for ${conversationId} in ${process.env.CONVERSATION_INACTIVITY_TIMEOUT_MS}ms`,
	);

	return { routerOutput, aiMessage };
}
