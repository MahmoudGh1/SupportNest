/* import { Redis } from "ioredis";

export const redis = new Redis(process.env.REDIS_URL!, {
	maxRetriesPerRequest: null,
});
 */
import { Redis } from "ioredis";

export const redis =
  process.env.DISABLE_REDIS === "true"
    ? undefined
    : new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: null,
      });