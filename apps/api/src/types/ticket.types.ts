import type { TicketStatus, TicketPriority } from "generated/prisma/enums.js";

// ─── AUTH (matches your existing authMiddleware payload) ──────────────────────
export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  organizationId: string;
}

export interface AuthenticatedRequest extends Express.Request {
  body: CreateTicketBody;
  query: any;
  user?: JwtPayload;
}

// ─── REQUEST BODIES ───────────────────────────────────────────────────────────
export interface CreateTicketBody {
  conversationId: string;
  priority?: TicketPriority;   // defaults to "medium" if omitted
}

export interface AssignTicketBody {
  assignedToId: string;        // user id of the support agent
}

export interface ResolveTicketBody {
  resolutionNote?: string;
}

// ─── RESPONSE ─────────────────────────────────────────────────────────────────
// Full ticket object — what every endpoint returns
export interface TicketResponse {
  id: string;
  conversationId: string;
  organizationId: string;
  assignedToId: string | null;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  status: TicketStatus;
  priority: TicketPriority;
  resolutionNote: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}