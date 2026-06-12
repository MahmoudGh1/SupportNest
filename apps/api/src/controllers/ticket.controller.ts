import type { Response, NextFunction } from "express";
import type {
	AuthenticatedRequest,
	CreateTicketBody,
	AssignTicketBody,
	ResolveTicketBody,
} from "../types/ticket.types.js";
import type { TicketStatus, TicketPriority } from "generated/prisma/enums.js";
import * as ticketService from "../services/ticket.service.js";
import type { Request } from "express";

// ─── POST /tickets ────────────────────────────────────────────────────────────
// Body: { conversationId, priority? }
// Called by: AI Tier 2 agent (auto-escalation) OR human agent (manual)
export async function createTicket(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const orgId = (req.user as any).organizationId;
		const { conversationId, priority } = req.body as CreateTicketBody;

		if (!conversationId) {
			res
				.status(400)
				.json({ success: false, message: "conversationId is required." });
			return;
		}

		const ticket = await ticketService.createTicket(
			orgId,
			conversationId,
			priority,
		);

		res.status(201).json({
			success: true,
			message: "Ticket created and conversation escalated.",
			data: { ticket },
		});
	} catch (err) {
		next(err);
	}
}

// ─── GET /tickets ─────────────────────────────────────────────────────────────
// Query: ?status=open&priority=high&assignedToId=xxx&page=1&limit=20
export async function getTickets(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const orgId = req.user!.orgId;

		const result = await ticketService.getTickets(orgId, {
			status: req.query.status as TicketStatus | undefined,
			priority: req.query.priority as TicketPriority | undefined,
			assignedToId: req.query.assignedToId as string | undefined,
			page: req.query.page ? Number(req.query.page) : undefined,
			limit: req.query.limit ? Number(req.query.limit) : undefined,
		});

		res.status(200).json({
			success: true,
			message: "Tickets fetched successfully.",
			data: result,
		});
	} catch (err) {
		next(err);
	}
}

// ─── GET /tickets/:id ─────────────────────────────────────────────────────────
export async function getTicketById(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const orgId = (req.user as any).organizationId;
		const ticketId = (req as Request<{ id: string }>).params.id;

		const ticket = await ticketService.getTicketById(orgId, ticketId);

		res.status(200).json({
			success: true,
			message: "Ticket fetched successfully.",
			data: { ticket },
		});
	} catch (err) {
		next(err);
	}
}

// ─── PATCH /tickets/:id/assign ────────────────────────────────────────────────
// Body: { assignedToId }
export async function assignTicket(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const orgId = (req.user as any).organizationId;
		const ticketId = (req as Request<{ id: string }>).params.id;
		const { assignedToId } = (req as Request).body as AssignTicketBody;

		if (!assignedToId) {
			res
				.status(400)
				.json({ success: false, message: "assignedToId is required." });
			return;
		}

		const ticket = await ticketService.assignTicket(
			orgId,
			ticketId,
			assignedToId,
		);

		res.status(200).json({
			success: true,
			message: "Ticket assigned successfully.",
			data: { ticket },
		});
	} catch (err) {
		next(err);
	}
}

// ─── PATCH /tickets/:id/start ─────────────────────────────────────────────────
// Moves ticket from open → in_progress
// Auto-assigns to the calling agent if unassigned
export async function startTicket(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const orgId = (req.user as any).organizationId;
		const agentId = req.user!.id;
		const ticketId = (req as Request<{ id: string }>).params.id;

		const ticket = await ticketService.startTicket(orgId, ticketId, agentId);

		res.status(200).json({
			success: true,
			message: "Ticket marked as in progress.",
			data: { ticket },
		});
	} catch (err) {
		next(err);
	}
}

// ─── PATCH /tickets/:id/resolve ───────────────────────────────────────────────
// Body: { resolutionNote? }
export async function resolveTicket(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		const orgId = (req.user as any).organizationId;
		const ticketId = (req as Request<{ id: string }>).params.id;
		const { resolutionNote } = req.body as ResolveTicketBody;

		const ticket = await ticketService.resolveTicket(
			orgId,
			ticketId,
			resolutionNote,
		);

		res.status(200).json({
			success: true,
			message: "Ticket resolved successfully.",
			data: { ticket },
		});
	} catch (err) {
		next(err);
	}
}
