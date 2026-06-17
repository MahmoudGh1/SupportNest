const { Queue } = require('bullmq');
const { redisConnection } = require('../lib/redis');

const notificationQueue = new Queue('notifications', { connection: redisConnection });

// Call this from any route/webhook handler right after the triggering action
// commits. It returns immediately - actual recipient resolution + DB writes
// + realtime broadcast happen in the worker, off the request path.
async function enqueueNotification(type: string, ctx: any) {
  await notificationQueue.add(
    'process',
    { type, ctx },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    }
  );
}

module.exports = { notificationQueue, enqueueNotification };