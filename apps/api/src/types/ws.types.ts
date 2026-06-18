import { WebSocket } from "ws";

export type WsEventType =
	| "auth" // client → server: first message to authenticate
	| "auth_ack" // server → client: auth confirmed, sends back conversation context
	| "message_send" // client → server: customer sends a message
	| "message_ai" // server → client: AI response
	| "typing" // server → client: AI is processing
	| "escalated" // server → client: escalation happened, ticket created
	| "error" // server → client: something went wrong
	| "conversation_closed"
	| "conversation_started";

export interface WsEnvelope {
	type: WsEventType;
	payload: Record<string, any> | WsSendMessagePayload;
}

export interface SocketMeta {
	organizationId: string;
	customerId: string;
	conversationId: string;
	apiKeyId: string;
}

export interface AuthenticatedSocket extends WebSocket {
	meta?: SocketMeta;
	authenticated?: boolean;
}

export type WsSendMessagePayload = {
	conversationId: string;
	content: string;
};
