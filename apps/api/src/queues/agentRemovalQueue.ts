import { Queue } from "bullmq";
import { redis } from "../config/redis.js";

export const agentRemovalQueue = new Queue("agentRemoval", {
	connection: redis as any,
});
