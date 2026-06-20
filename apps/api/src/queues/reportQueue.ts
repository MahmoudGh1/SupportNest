import { Queue } from "bullmq";
import { redis } from "../config/redis.js"; // adjust if knowledgeQueue.ts imports differently

export const reportQueue = new Queue("generate-report", {
	connection: redis as any,
	defaultJobOptions: {
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: 5000, // 5s, then 10s, then 20s
		},
	},
});
