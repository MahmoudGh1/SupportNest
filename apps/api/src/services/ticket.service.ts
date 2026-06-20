import prisma from "../config/prisma.js";
import type { TicketPriority, TicketStatus } from "generated/prisma/enums.js";
import AppError from "../utils/appError.js";
import type { UpdateTicketInput } from "src/types/ticket.types.js";
import type { Prisma } from "generated/prisma/client.js";

// ─── PRISMA SELECT ────────────────────────────────────────────────────────────
// Reused in every query so the response shape is always consistent
const ticketSelect = {
	id: true,
	conversationId: true,
	organizationId: true,
	assignedToId: true,
	assignedTo: {
		select: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
		},
	},
	status: true,
	priority: true,
	resolutionNote: true,
	resolvedAt: true,
	createdAt: true,
	updatedAt: true,
	conversation: {
		select: {
			id: true,
			conversationStatus: true,
			createdAt: true,
			messages: {
				orderBy: { createdAt: "asc" as const },
				select: {
					id: true,
					role: true,
					content: true,
					createdAt: true,
				},
			},
		},
	},
} as const;

// ─── CREATE TICKET ────────────────────────────────────────────────────────────
// Called by: AI Tier 2 agent (auto) OR human agent (manual) from dashboard
export async function createTicket(
	organizationId: string,
	conversationId: string,
	priority: TicketPriority = "MEDIUM",
) {
	// 1. Verify the conversation exists and belongs to this org
	const conversation = await prisma.conversation.findUnique({
		where: { id: conversationId },
		select: { id: true, organizationId: true, conversationStatus: true },
	});

	if (!conversation) {
		throw new AppError("Conversation not found.", 404);
	}

	if (conversation.organizationId !== organizationId) {
		throw new AppError(
			"Conversation does not belong to your organization.",
			403,
		);
	}

	// 2. Prevent duplicate tickets for the same conversation
	const existing = await prisma.ticket.findUnique({
		where: { conversationId },
	});

	if (existing) {
		throw new AppError("A ticket already exists for this conversation.", 409);
	}

	// 3. Create ticket + update conversation status to escalated atomically
	const [ticket] = await prisma.$transaction([
		prisma.ticket.create({
			data: {
				conversationId,
				organizationId: organizationId,
				status: "OPEN",
				priority,
			},
			select: ticketSelect,
		}),
		prisma.conversation.update({
			where: { id: conversationId },
			data: { conversationStatus: "ESCALATED" },
		}),
	]);

	return ticket;
}

// ─── GET TICKETS (org-scoped, paginated, filterable) ─────────────────────────
export async function getTickets(
	organizationId: string,
	filters: {
		status?: TicketStatus | undefined;
		priority?: TicketPriority | undefined;
		assignedToId?: string | undefined;
		page?: number | undefined;
		limit?: number | undefined;
	} = {},
) {
	const page = Math.max(1, filters.page ?? 1);
	const limit = Math.min(100, filters.limit ?? 20);
	const skip = (page - 1) * limit;

	const where = {
		organizationId: organizationId,
		...(filters.status && { status: filters.status }),
		...(filters.priority && { priority: filters.priority }),
		...(filters.assignedToId && { assignedToId: filters.assignedToId }),
	};

	const [tickets, total] = await prisma.$transaction([
		prisma.ticket.findMany({
			where,
			select: ticketSelect,
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.ticket.count({ where }),
	]);

	return {
		tickets,
		meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
	};
}

// ─── GET SINGLE TICKET ────────────────────────────────────────────────────────
export async function getTicketById(organizationId: string, ticketId: string) {
	const ticket = await prisma.ticket.findFirst({
		where: { id: ticketId, organizationId },
		select: {
			id: true,
			status: true,
			priority: true,
			resolutionNote: true,
			resolvedAt: true,
			agentAttempts: true,
			createdAt: true,
			updatedAt: true,
			assignedTo: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					email: true,
				},
			},
			conversation: {
				select: {
					id: true,
					conversationStatus: true,
					closedAt: true,
					createdAt: true,
					customer: {
						select: {
							id: true,
							externalId: true,
							email: true,
							name: true,
							isAnonymous: true,
							metadata: true,
						},
					},
					messages: {
						orderBy: { createdAt: "asc" },
						select: {
							id: true,
							role: true,
							content: true,
							tier: true,
							createdAt: true,
						},
					},
					reports: {
						select: {
							summary: true,
							issueType: true,
							resolution: true,
							language: true,
							sentiment: true,
							tiersVisited: true,
							wasEscalated: true,
							resolvedByAi: true,
							tokensUsed: true,
							createdAt: true,
						},
					},
				},
			},
		},
	});

	if (!ticket) {
		throw new AppError("Ticket not found", 404);
	}

	// flatten so controller/frontend gets a clean shape:
	// { ticket: {...}, conversation: {...}, customer: {...}, messages: [...], report: {...} }
	const { conversation, ...ticketFields } = ticket;
	const { customer, messages, reports, ...conversationFields } = conversation;

	return {
		ticket: ticketFields,
		conversation: conversationFields,
		customer,
		messages,
		report: reports ?? null,
	};
}

// ─── START TICKET (OPEN → IN_PROGRESS) ───────────────────────────────────────
export async function startTicket(
	organizationId: string,
	ticketId: string,
	agentId: string,
) {
	const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
	if (!ticket) throw new AppError("Ticket not found.", 404);
	if (ticket.organizationId !== organizationId)
		throw new AppError("Access denied.", 403);
	if (ticket.status === "RESOLVED")
		throw new AppError("Ticket is already resolved.", 400);
	if (ticket.status === "IN_PROGRESS")
		throw new AppError("Ticket is already in progress.", 400);

	return prisma.ticket.update({
		where: { id: ticketId },
		data: {
			status: "IN_PROGRESS",
			assignedToId: ticket.assignedToId ?? agentId,
		},
		select: ticketSelect,
	});
}

// ─── RESOLVE TICKET ───────────────────────────────────────────────────────────
export async function resolveTicket(
	organizationId: string,
	ticketId: string,
	resolutionNote: string | undefined,
) {
	const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
	if (!ticket) throw new AppError("Ticket not found.", 404);
	if (ticket.organizationId !== organizationId)
		throw new AppError("Access denied.", 403);
	if (ticket.status === "RESOLVED")
		throw new AppError("Ticket is already resolved.", 400);

	return prisma.ticket.update({
		where: { id: ticketId },
		data: {
			status: "RESOLVED",
			resolutionNote: resolutionNote ?? null,
			resolvedAt: new Date(),
		},
		select: ticketSelect,
	});
}

export async function updateTicket(
	organizationId: string,
	ticketId: string,
	input: UpdateTicketInput,
) {
	const existing = await prisma.ticket.findFirst({
		where: { id: ticketId, organizationId },
		select: { id: true },
	});
	if (!existing) throw new AppError("Ticket not found", 404);

	if (input.assignedToId) {
		const agent = await prisma.user.findFirst({
			where: { id: input.assignedToId, organizationId, isActive: true },
			select: { id: true },
		});
		if (!agent)
			throw new AppError("Assignee not found in this organization", 400);
	}

	const data: Prisma.TicketUpdateInput = {};
	if (input.status) {
		data.status = input.status;
		if (input.status === "RESOLVED") data.resolvedAt = new Date();
	}
	if (input.priority) data.priority = input.priority;
	if (input.resolutionNote !== undefined)
		data.resolutionNote = input.resolutionNote;
	if (input.assignedToId !== undefined) {
		// undefined = leave the assignment as it is
		// given value = "Connect this ticket to the user whose ID is user123."
		// null = "Remove the relationship between this ticket and its assigned user."

		/*
		"If the client sent an assignedToId, then either assign the record to that user (when an ID is provided)
		 or remove the assignment (when the value is empty/null). If the client didn't send assignedToId at all,
		  don't change the current assignment."
		*/

		// Why use [connect]? because it's not a normal column, assignedTo is a relation field to another table
		data.assignedTo = input.assignedToId
			? { connect: { id: input.assignedToId } }
			: { disconnect: true };
	}

	return prisma.ticket.update({
		where: { id: ticketId },
		data,
		select: {
			id: true,
			status: true,
			priority: true,
			resolutionNote: true,
			resolvedAt: true,
			agentAttempts: true,
			createdAt: true,
			updatedAt: true,
			assignedTo: {
				select: { id: true, firstName: true, lastName: true, email: true },
			},
		},
	});
}
