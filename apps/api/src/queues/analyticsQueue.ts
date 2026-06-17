// src/queues/analyticsQueue.ts
import { Queue } from "bullmq";
import { redis } from "src/config/redis.js";
import type { AnalyticsJobData } from "src/types/analytics.types.js";

export const analyticsQueue = new Queue<AnalyticsJobData>(
	"compute-analytics",
	{
		connection: redis as any,
		defaultJobOptions: {
			attempts: 3,
			backoff: {
				type: "exponential",
				delay: 5000,
			},
			removeOnComplete: true,
			removeOnFail: false,
		},
	},
);
