import { Queue } from "bullmq";
import { redis } from "../config/redis.js"; // adjust if knowledgeQueue.ts imports differently

/*
processPipelineTurn => add/remove jobs 
worker => selects a job to process
*/
export const conversationCloseQueue = new Queue("conversation-close", {
	connection: redis as any,
});
