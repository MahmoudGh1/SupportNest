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
import * as widgetServerSdk from "src/config/widget-server-sdk.js";
import { normalizeOrigin } from "src/utils/normalizeOrigin.util.js";

export function send(socket: AuthenticatedSocket, envelope: WsEnvelope) {
	socket.send(JSON.stringify(envelope));
}

async function connectionAuth(
	socket: AuthenticatedSocket,
	payload: Record<string, any>,
	req: IncomingMessage,
) {
	console.log("connectionAuth start");
	const { apiKey, customerJwt, visitorId } = payload;

	console.log(apiKey, customerJwt, visitorId);

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

	if (!isKey || !isKey.isActive || !isKey.organization.isActive) {
		send(socket, {
			type: "error",
			payload: {
				message: "Invalid API key. your organizations is not authorized.",
			},
		});
		socket.close(4401, "Unauthorized");
		return false;
	}

	console.log("Key exists");

	//TODO : stolen api keys would work at the current state

	const origin =
		typeof req.headers.origin == "string" ? req.headers.origin : undefined;
	console.log(origin);

	const normalizedIncoming = normalizeOrigin(origin);

	const isAllowedOrigin =
		normalizedIncoming !== null &&
		isKey.allowedOrigins.some(
			(allowed) => normalizeOrigin(allowed) === normalizedIncoming,
		);

	if (!isAllowedOrigin) {
		send(socket, {
			type: "error",
			payload: { message: "Origin not allowed" },
		});
		socket.close(4401, "Unauthorized");
		return false;
	}

	let customer = null;

	if (customerJwt) {
		let verifyError: any = null;
		let customerPayload: any = await widgetServerSdk.verifyToken(
			isKey.organization.widgetSecret,
			customerJwt,
			(err: any) => {
				verifyError = err;
			},
		);

		if (verifyError || !customerPayload) {
			send(socket, {
				type: "error",
				payload: {
					message: verifyError?.message || "not a valid customerJwt",
				},
			});
			socket.close(4401, "Unauthorized");
			return false;
		}

		const { userId, email } = customerPayload;

		customer = await prisma.customer.upsert({
			where: {
				organizationId_externalId: {
					organizationId: isKey.organizationId,
					externalId: userId,
				},
			},
			update: {
				email: email ?? undefined,
			},
			create: {
				organizationId: isKey.organizationId,
				externalId: userId,
				email: email ?? null,
				name: null,
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

	console.log("conversation started or resumed");

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

	const existing = activeSockets.get(socket.meta.conversationId);
	if (
		existing &&
		existing !== socket &&
		existing.readyState === existing.OPEN
	) {
		existing.close(4000, "Replaced by new connection");
	}

	activeSockets.set(socket.meta.conversationId, socket);

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

	return true;
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
						socket.authAttempts = (socket.authAttempts ?? 0) + 1;
						if (socket.authAttempts > 3) {
							send(socket, {
								type: "error",
								payload: { message: "Too many attempts" },
							});
							clearTimeout(authTimeout);
							socket.close(4401, "Unauthorized");
							return;
						}

						const ok = await connectionAuth(socket, envelope.payload, req);

						if (ok) {
							clearTimeout(authTimeout);
						} else {
							send(socket, {
								type: "error",
								payload: { message: "Authentication failed" },
							});
							// leave authTimeout running — it'll close the socket at 5s if they don't succeed
						}
						return;
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
