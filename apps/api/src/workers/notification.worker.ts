import { Worker, type Job } from "bullmq";
import { redis } from "../config/redis.js";
import { processNotification } from "../services/notification.service.js";

export const notificationWorker = new Worker(
  "notifications",
  async (job: Job) => {
    const { type, ctx } = job.data as {
      type:
        | "organization_registered"
        | "user_added"
        | "user_deleted"
        | "payment_completed"
        | "contact_us_submitted"
        | "ticket_escalated"
        | "csat_submitted"
        | "new_customer_first_contact"
        | "organization_suspended"
        | "organization_reactivated";
      ctx: Record<string, unknown>;
    };
    await processNotification(type, ctx);
  },
  { connection: redis as any, concurrency: 5 },
);

notificationWorker.on("ready", () => {
  console.log("✓ Notification worker connected and listening");
});

notificationWorker.on("completed", (job) => {
  console.log(`✓ Processed job ${job.id} (${job.data.type})`);
});

notificationWorker.on("failed", (job, err) => {
  console.error(`✗ Job ${job?.id} failed:`, err.message);
});
