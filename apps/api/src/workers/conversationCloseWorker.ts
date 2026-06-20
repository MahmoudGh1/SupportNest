// src/workers/conversationCloseWorker.ts
import { Worker } from "bullmq";
import prisma from "src/config/prisma.js";
import { redis } from "src/config/redis.js";
import { analyticsQueue } from "src/queues/analyticsQueue.js";
import { activeSockets } from "src/websocket/ws.map.js";
import { send } from "src/ws/websocket.js";

export const conversationCloseWorker = new Worker(
	"conversation-close",
	async (job) => {
		const { conversationId, organizationId } = job.data;

		// mark the conversation as closed — this is what the analytics
		// worker watches for (per schema design: conversation_status drives lifecycle)
		await prisma.conversation.update({
			where: { id: conversationId },
			data: {
				conversationStatus: "CLOSED",
				closedAt: new Date(),
			},
		});
		console.log(`[close-worker] closed conversation ${conversationId}`);

		//* But what about a message that's already in flight the instant the close fires — i.e., customer hits send in the same ~100ms window the timer expires? [fix later]
		// inform the widget via the open socket that the conversation with id <id> has been closed
		const socket = activeSockets.get(conversationId);
		if (socket) {
			send(socket, {
				type: "conversation_closed",
				payload: {
					conversationId,
					reason: "inactivity",
				},
			});
		}

		await analyticsQueue.add("compute-analytics", {
			conversationId,
			organizationId,
		});
	},
	{ connection: redis as any },
);

conversationCloseWorker.on("ready", () => {
	console.log("[conversationCloseWorker] connected and listening for jobs");
});
