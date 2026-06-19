import { enqueueNotification } from "./src/queues/notification.queue.js";

await enqueueNotification("organization_registered", {
  organization_id: "PASTE_A_REAL_ORG_ID",
  organization_name: "Test Org",
});
console.log("enqueued");
