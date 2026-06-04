import { Queue } from "bullmq";
import { redis } from "../lib/redis.js";

export const knowledgeQueue = new Queue("process-document", {
	connection: redis as any,
});
