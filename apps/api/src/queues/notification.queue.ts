import { Job, Queue, Worker } from "bullmq";
import { redis } from "../config/redis.js";
import { processNotification } from "../services/notification.service.js";

export const notificationQueue = new Queue("notifications", {
  connection: redis as any,
});

const notificationWorker = new Worker(
  "notifications",
  async (job: Job) => {
    const { type, ctx } = job.data;
    await processNotification(type, ctx);
  },
  {
    connection: redis as any,
    concurrency: 5,
  },
);

notificationWorker.on("failed", (job, err) => {
  console.error(`Notification job ${job?.id} failed:`, err.message);
});

export async function enqueueNotification(
  type: string,
  ctx: Record<string, unknown>,
) {
  await notificationQueue.add(
    "process",
    { type, ctx },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  );
}
