import type { ConversationMessage } from "src/types/agent.types.js";
import { redis } from "../config/redis.js";

export interface MemoryMessage {
	role: "customer" | "ai";
	content: string;
}

const MEMORY_TTL_SECONDS = 60 * 60 * 4;
const MAX_MESSAGES = 10;
const KEY_PREFIX = "conversation:memory:";

function memoryKey(conversationId: string): string {
	return `${KEY_PREFIX}${conversationId}`;
}

export async function loadMemory(
	conversationId: string,
): Promise<ConversationMessage[]> {
	try {
		const raw = await redis.get(memoryKey(conversationId));
		if (!raw) return [];
		return JSON.parse(raw) as ConversationMessage[];
	} catch (err) {
		console.error(
			"[Memory] Failed to load memory for conversation:",
			conversationId,
			err,
		);
		return [];
	}
}

export async function appendToMemory(
	conversationId: string,
	customerMessage: string,
	aiResponse: string,
): Promise<void> {
	try {
		const existing = await loadMemory(conversationId);

		const updated: MemoryMessage[] = [
			...existing,
			{ role: "customer", content: customerMessage },
			{ role: "ai", content: aiResponse },
		];

		const trimmed = updated.slice(-MAX_MESSAGES);

		await redis.set(
			memoryKey(conversationId),
			JSON.stringify(trimmed),
			"EX",
			MEMORY_TTL_SECONDS,
		);
	} catch (err) {
		console.error(
			"[Memory] Failed to append memory for conversation:",
			conversationId,
			err,
		);
	}
}

export async function clearMemory(conversationId: string): Promise<void> {
	try {
		await redis.del(memoryKey(conversationId));
	} catch (err) {
		console.error(
			"[Memory] Failed to clear memory for conversation:",
			conversationId,
			err,
		);
	}
}
