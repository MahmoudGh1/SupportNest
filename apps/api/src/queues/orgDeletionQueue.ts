import { Queue } from "bullmq";

import { redis } from "../config/redis.js";

export const orgDeletionQueue = new Queue("orgDeletion", {
	connection: redis,
});
