import prisma from "../config/prisma.js";
import type { TicketPriority, TicketStatus } from "generated/prisma/enums.js";
import AppError from "../utils/appError.js";

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
	const ticket = await prisma.ticket.findUnique({
		where: { id: ticketId, organizationId },
		include: {
			conversation: {
				include: { reports: true },
			},
			assignedTo: true,
		},
	});

	if (!ticket) {
		// existing not-found handling
		throw new AppError("ticket not found");
	}

	const { conversation, ...ticketFields } = ticket;
	const { reports, ...conversationFields } = conversation;

	const ticketData = {
		...ticketFields,
		reports, // flattened, top-level
		conversation: conversationFields,
	};

	return ticketData;
}

// ─── ASSIGN TICKET ────────────────────────────────────────────────────────────
export async function assignTicket(
	organizationId: string,
	ticketId: string,
	assignedToId: string,
) {
	const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
	if (!ticket) throw new AppError("Ticket not found.", 404);
	if (ticket.organizationId !== organizationId)
		throw new AppError("Access denied.", 403);
	if (ticket.status === "RESOLVED")
		throw new AppError("Cannot assign a resolved ticket.", 400);

	// Verify the agent belongs to the same org
	const agent = await prisma.user.findUnique({
		where: { id: assignedToId },
		select: { id: true, organizationId: true },
	});

	if (!agent) throw new AppError("Agent not found.", 404);
	if (agent.organizationId !== organizationId)
		throw new AppError("Agent does not belong to your organization.", 403);

	return prisma.ticket.update({
		where: { id: ticketId },
		data: { assignedToId, status: "OPEN" },
		select: ticketSelect,
	});
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
