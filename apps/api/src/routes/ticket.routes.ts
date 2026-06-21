import express, { Router } from "express";
import { authMiddleware } from "src/middlewares/auth.middleware.js";
import * as ticketController from "../controllers/ticket.controller.js";

const ticketRouter: Router = express.Router();

// All ticket routes require authentication
ticketRouter.use(authMiddleware);

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// POST   /api/v1/tickets              → create ticket (AI or human triggers)
ticketRouter.post("/", ticketController.createTicket);

// GET    /api/v1/tickets              → list all tickets for org (filterable)
// Query: ?status=open&priority=high&assignedToId=xxx&page=1&limit=20
ticketRouter.get("/", ticketController.getTickets);

ticketRouter.get("/counts", ticketController.getTicketsCount);

// GET    /api/v1/tickets/:id          → get single ticket
ticketRouter.get("/:id", ticketController.getTicketById);

// PATCH  /api/v1/tickets/:id/assign   → assign ticket to an agent
// Body:  { assignedToId: string }
ticketRouter.patch("/:id/assign", ticketController.assignTicket);

// PATCH  /api/v1/tickets/:id/start    → mark in_progress (agent picks it up)
ticketRouter.patch("/:id/start", ticketController.startTicket);

// PATCH  /api/v1/tickets/:id/resolve  → resolve ticket
// Body:  { resolutionNote?: string }
ticketRouter.patch("/:id/resolve", ticketController.resolveTicket);

ticketRouter.patch("/:id", authMiddleware, ticketController.updateTicket);

export default ticketRouter;
