import type { AuthenticatedSocket } from "src/types/ws.types.js";
// In-memory map: conversationId => WebSocket instance
// a server-side tracking system that monitors all currently open, connected WebSocket clients.

export const activeSockets = new Map<string, AuthenticatedSocket>();
