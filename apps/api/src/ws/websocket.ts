import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import prisma from "../config/prisma.js";
import crypto from "crypto";
import type {
	WsEnvelope,
	SocketMeta,
	AuthenticatedSocket,
	WsSendMessagePayload,
} from "../types/ws.types.js";
import { verifyToken } from "src/utils/jwt.util.js";
import { handleMessageSend } from "src/websocket/handlers/message.handler.js";
import { activeSockets } from "src/websocket/ws.map.js";
import * as conversationService from "src/services/conversations.service.js";

function send(socket: AuthenticatedSocket, envelope: WsEnvelope) {
	socket.send(JSON.stringify(envelope));
}

async function connectionAuth(
	socket: AuthenticatedSocket,
	payload: Record<string, any>,
	req: IncomingMessage,
) {
	const { apiKey, customerJwt, visitorId } = payload;

	if (!apiKey) {
		send(socket, {
			type: "error",
			payload: { message: "apiKey is required" },
		});
		socket.close();
		return;
	}

	const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

	const isKey = await prisma.apiKey.findUnique({
		where: { keyHash },
		include: { organization: true },
	});
	if (!isKey || !isKey.isActive || !isKey.organizationId) {
		send(socket, {
			type: "error",
			payload: {
				message: "Invalid API key. your organizations is not authorized.",
			},
		});
		socket.close();
		return;
	}

	//TODO : stolen api keys would work at the current state

	const origin =
		typeof req.headers.origin == "string" ? req.headers.origin : undefined;

	const isAllowedOrigin: boolean =
		origin !== undefined && isKey.allowedOrigins.includes(origin);

	// if (!isAllowedOrigin) {
	// 	return null;
	// }

	let customer = null;

	if (customerJwt) {
		let customerPayload: any = verifyToken(
			customerJwt,
			isKey.organization.widgetSecret,
		);

		if (!customerPayload) {
			send(socket, {
				type: "error",
				payload: { message: "not a valid customerJwt" },
			});
			socket.close();
			return;
		}

		const { externalId, email, name } = customerPayload;

		customer = await prisma.customer.upsert({
			where: {
				organizationId_externalId: {
					organizationId: isKey.organizationId,
					externalId: externalId,
				},
			},
			update: {
				email: email ?? undefined,
				name: name ?? undefined,
			},
			create: {
				organizationId: isKey.organizationId,
				externalId,
				email: email ?? null,
				name: name ?? null,
				isAnonymous: false,
			},
		});
	} else {
		customer = await prisma.customer.upsert({
			where: {
				organizationId_externalId: {
					organizationId: isKey.organizationId,
					externalId: visitorId ?? `anon_fallback_${Date.now()}`,
				},
			},
			update: {},
			create: {
				organizationId: isKey.organizationId,
				externalId: visitorId,
				isAnonymous: true,
			},
		});
	}

	/* Conversation Initialization is already handled in the conversation service */

	const conversation = await conversationService.startConversation({
		organizationId: isKey.organizationId,
		customerId: customer.id,
		apiKeyId: isKey.id,
	});

	const conversationMemory = await prisma.message.findMany({
		where: { conversationId: conversation.id },
		orderBy: { createdAt: "asc" },
		take: 100,
	});

	socket.authenticated = true;
	socket.meta = {
		organizationId: isKey.organizationId,
		customerId: customer.id,
		conversationId: conversation.id,
		apiKeyId: isKey.id,
	};

	/* WARNING: the conversation socket is not set in the activeSockets map */

	send(socket, {
		type: "auth_ack",
		payload: {
			conversationId: conversation.id,
			history: conversationMemory.map((m) => ({
				role: m.role,
				content: m.content,
				createdAt: m.createdAt,
			})),
			widgetConfig: isKey.organization.widgetConfig,
		},
	});
}

export function setupWebSocket(wss: WebSocketServer) {
	wss.on("connection", (socket: AuthenticatedSocket, req: IncomingMessage) => {
		socket.authenticated = false;

		const authTimeout = setTimeout(() => {
			if (!socket.authenticated) {
				send(socket, { type: "error", payload: { message: "Auth timeout" } });
				socket.close();
			}
		}, 5000);

		socket.on("message", async (raw) => {
			try {
				const envelope: WsEnvelope = JSON.parse(raw.toString());

				if (!socket.authenticated) {
					if (envelope.type === "auth") {
						clearTimeout(authTimeout);
						await connectionAuth(socket, envelope.payload, req);
					} else {
						send(socket, {
							type: "error",
							payload: { message: "Not authenticated" },
						});
						socket.close();
					}
					return;
				}

				if (envelope.type === "message_send") {
					await handleMessageSend(
						socket,
						envelope.payload as WsSendMessagePayload,
					);
				}
			} catch (err) {
				console.error("Web Socket Error:", err);
				send(socket, { type: "error", payload: { message: "Server error" } });
			}
		});

		socket.on("close", () => {
			if (socket.meta) {
				activeSockets.delete(socket.meta.conversationId);
			}
		});

		socket.on("error", (err) => {
			console.error("Web Socket error:", err);
		});
	});
}
