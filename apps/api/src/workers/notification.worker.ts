import type { Job } from "bullmq";
const { Worker } = require("bullmq");
const { redisConnection } = require("../lib/redis");
const { processNotification } = require("./notification.service");

const notificationWorker = new Worker(
  "notifications",
  async (job: Job) => {
    const { type, ctx } = job.data as any;
    await processNotification(type, ctx);
  },
  { connection: redisConnection, concurrency: 5 },
);

notificationWorker.on("failed", (job: any, err: Error) => {
  console.error(`Notification job ${job?.id} failed:`, err.message);
});

module.exports = { notificationWorker };
