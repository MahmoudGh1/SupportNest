import { AuthenticatedSocket } from "../types/ws.types";

// In-memory map: conversationId => WebSocket instance
// a server-side tracking system that monitors all currently open, connected WebSocket clients.

export const activeSockets = new Map<string, AuthenticatedSocket>();
