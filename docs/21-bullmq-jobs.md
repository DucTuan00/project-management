# BullMQ Jobs

## Purpose
Define the BullMQ job processing architecture including queue definitions, worker implementations, retry strategies, dead letter handling, and all scheduled/recurring jobs.

## Responsibilities

- Email sending (verification, password reset, notifications)
- Push notification delivery
- Activity log batch processing
- Analytics data aggregation
- Scheduled maintenance jobs (cleanup, archiving)
- Rate-limited job execution with backpressure handling

## Queue Definitions

```typescript
// jobs/queues.ts
import { Queue } from 'bullmq';
import { bullRedis } from '../config/redis';

export const emailQueue = new Queue('email', {
  connection: bullRedis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 3600 * 24 },    // Keep completed jobs for 24h
    removeOnFail: { age: 3600 * 24 * 7 },    // Keep failed jobs for 7 days
  },
});

export const notificationQueue = new Queue('notification', {
  connection: bullRedis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 3600 * 24 },
  },
});

export const activityQueue = new Queue('activity', {
  connection: bullRedis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 3600 * 24 },
  },
});

export const analyticsQueue = new Queue('analytics', {
  connection: bullRedis,
  defaultJobOptions: {
    attempts: 1,                    // Analytics jobs don't retry
    removeOnComplete: { age: 3600 * 24 },
    removeOnFail: { age: 3600 * 24 * 3 },
  },
});

export const cleanupQueue = new Queue('cleanup', {
  connection: bullRedis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 30000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 3600 * 24 },
  },
});
```

## Job Definitions

### Email Queue

| Job Name | Payload | Priority | Description |
|----------|---------|----------|-------------|
| email.verification | { userId, email, token } | High | Send email verification link |
| email.welcome | { userId, email, inviteToken? } | High | Welcome email with optional invite |
| email.password-reset | { userId, email, token } | High | Password reset link |
| email.notification | { userId, email, notificationId } | Low | Notification digest email |
| email.invite | { workspaceId, email, invitedBy, token } | High | Workspace invitation |

### Notification Queue

| Job Name | Payload | Priority | Description |
|----------|---------|----------|-------------|
| notification.deliver | { notificationId, userId, type } | Medium | Deliver in-app + realtime notification |
| notification.batch | { notificationIds: [] } | Low | Batch deliver multiple notifications |

### Activity Queue

| Job Name | Payload | Description |
|----------|---------|-------------|
| activity.process | { activityId } | Process and enrich activity entry |
| activity.batch | { activityIds: [] } | Batch process activity entries |

### Analytics Queue

| Job Name | Payload | Schedule | Description |
|----------|---------|----------|-------------|
| velocity.calculate | { projectId, sprintId } | On sprint complete | Calculate velocity |
| workload.compute | { projectId } | Hourly | Compute task distribution |
| trends.aggregate | { workspaceId } | Daily (midnight) | Week-over-week trends |
| burndown.snapshot | { sprintId } | Hourly | Snapshot sprint progress |

### Cleanup Queue

| Job Name | Payload | Schedule | Description |
|----------|---------|----------|-------------|
| cleanup.orphaned-files | {} | Daily (3 AM) | Remove storage for deleted attachments |
| cleanup.expired-tokens | {} | Daily (3 AM) | Remove expired password reset tokens |
| cleanup.activity-archive | {} | Weekly (Sunday) | Archive activity logs older than 12 months |

## Worker Implementations

### Email Worker

```typescript
// jobs/email.worker.ts
import { Worker } from 'bullmq';
import { bullRedis } from '../config/redis';
import { emailService } from '../modules/email/email.service';

const emailWorker = new Worker('email', async (job) => {
  switch (job.name) {
    case 'email.verification':
      await emailService.sendVerificationEmail(job.data);
      break;
    case 'email.password-reset':
      await emailService.sendPasswordResetEmail(job.data);
      break;
    case 'email.notification':
      await emailService.sendNotificationEmail(job.data);
      break;
    case 'email.invite':
      await emailService.sendInviteEmail(job.data);
      break;
    default:
      throw new Error(`Unknown job name: ${job.name}`);
  }
}, {
  connection: bullRedis,
  concurrency: 5,                  // Process 5 emails concurrently
  limiter: {
    max: 10,                       // Max 10 emails
    duration: 1000,                // per second (respect SendGrid limits)
  },
});

emailWorker.on('completed', (job) => {
  logger.info({ jobId: job.id, name: job.name }, 'Email job completed');
});

emailWorker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, name: job.name, error: err.message }, 'Email job failed');
  if (job.attemptsMade >= job.opts.attempts) {
    // Move to dead letter - notify admin
    notifyAdminOfDeadLetter(job);
  }
});
```

### Notification Worker

```typescript
const notificationWorker = new Worker('notification', async (job) => {
  switch (job.name) {
    case 'notification.deliver': {
      const { userId, notificationId } = job.data;
      // 1. Fetch notification from DB
      const notification = await notificationRepository.findById(notificationId);
      if (!notification) return; // Already cleaned up

      // 2. Deliver realtime via Socket.IO
      const socketIds = await redisClient.smembers(`presence:user:${userId}`);
      for (const socketId of socketIds) {
        io.to(socketId).emit('notification:new', notification);
      }

      // 3. If email delivery enabled, enqueue email job
      const prefs = await userService.getNotificationPreferences(userId);
      if (prefs.email[notification.type]) {
        await emailQueue.add('email.notification', {
          userId, email: notification.userEmail, notificationId
        });
      }
      break;
    }
  }
}, {
  connection: bullRedis,
  concurrency: 10,
});
```

## Retry Strategy

| Queue | Max Attempts | Backoff | When to Give Up |
|-------|-------------|---------|-----------------|
| email | 3 | Exponential (2s, 4s, 8s) | After 3 failures |
| notification | 3 | Exponential (1s, 2s, 4s) | After 3 failures |
| activity | 2 | Fixed (5s) | After 2 failures |
| analytics | 1 | None | First failure drops |
| cleanup | 2 | Fixed (30s) | After 2 failures |

**Why different strategies**:
- **Email** gets exponential backoff because email providers may be temporarily unavailable (rate limits, outages). 3 attempts over ~14 seconds is reasonable.
- **Notification** has shorter backoff because realtime delivery should be quick. If a user is offline, the notification is already stored in DB - the realtime delivery is best-effort.
- **Analytics** does not retry because missed metrics are picked up by the next scheduled run or are recomputed on demand.
- **Cleanup** jobs have long backoff because they may contend with active file operations.

## Dead Letter Strategy

When a job exhausts all retry attempts, it remains in the failed set with `removeOnFail` keeping it for the configured retention period.

**Handling failed jobs**:
1. Worker emits `failed` event with job data and error
2. Log the failure with structured error details
3. For email jobs: after 3 failures, notify admin via separate admin notification channel
4. For notification jobs: after 3 failures, log and discard (user will still see in-app notification)
5. Manual retry from BullMQ UI or API: `POST /api/admin/queues/:queue/retry/:jobId`

**Monitoring**: BullMQ Board (or Arena) accessible via admin route for viewing queue status, retrying jobs, and inspecting failures.

## Scheduled Jobs

```typescript
// jobs/scheduler.ts
import { QueueScheduler } from 'bullmq';

// Recurring jobs defined as repeatable
await analyticsQueue.add('trends.aggregate', { workspaceId: 'all' }, {
  repeat: { pattern: '0 0 * * *' },   // Daily at midnight
  jobId: 'trends-daily',                // Deduplication key
});

await analyticsQueue.add('workload.compute', { projectId: 'all' }, {
  repeat: { pattern: '0 * * * *' },     // Hourly
  jobId: 'workload-hourly',
});

await cleanupQueue.add('cleanup.orphaned-files', {}, {
  repeat: { pattern: '0 3 * * *' },     // Daily at 3 AM
  jobId: 'cleanup-files-daily',
});

await cleanupQueue.add('cleanup.expired-tokens', {}, {
  repeat: { pattern: '0 3 * * *' },
  jobId: 'cleanup-tokens-daily',
});
```

## Job Queue Integration with EventBus

The EventBus automatically forwards events to appropriate BullMQ queues:

```typescript
// shared/event-bus/event-bus.ts
class EventBus {
  async publish(event: DomainEvent): Promise<void> {
    // Run sync handlers (activity log)
    await this.runSyncHandlers(event);

    // Forward async handlers to BullMQ
    if (event.name.startsWith('email.')) {
      await emailQueue.add(event.name, event.payload);
    }
    if (event.name.startsWith('notification.')) {
      await notificationQueue.add('notification.deliver', event.payload);
    }
    if (event.name.startsWith('analytics.')) {
      await analyticsQueue.add(event.name, event.payload);
    }
    if (event.name.startsWith('activity.')) {
      await activityQueue.add(event.name, event.payload);
    }
  }
}
```

## Concurrency and Limiter Configuration

| Queue | Concurrency | Rate Limit | Rationale |
|-------|-------------|------------|-----------|
| email | 5 | 10/s | Respect email provider rate limits |
| notification | 10 | None | Fast, lightweight operations |
| activity | 20 | None | Simple DB writes |
| analytics | 1 | None | Avoid overloading DB with heavy queries |
| cleanup | 1 | None | Avoid resource contention |

## Monitoring and Administration

**BullMQ Board**: Accessible at `/api/admin/queues` (Super Admin only). Shows:
- Queue stats (waiting, active, completed, failed counts)
- Job details (data, attempts, timestamps)
- Manual retry of failed jobs
- Queue pause/resume

**Health check endpoint**: `GET /api/health/queues` returns status of each queue:
```json
{
  "email": { "waiting": 5, "active": 2, "failed": 0 },
  "notification": { "waiting": 12, "active": 3, "failed": 1 },
  "analytics": { "waiting": 0, "active": 0, "failed": 0 }
}
```

## Graceful Shutdown

```typescript
// On SIGTERM/SIGINT:
await emailWorker.close();
await notificationWorker.close();
await activityWorker.close();
await analyticsWorker.close();
await cleanupWorker.close();
```

Workers close after the current running jobs complete (no force-kill). New jobs remain in queues and are picked up on restart.

## Design Decisions

- **Separate queues per domain** - Allows independent scaling, retry strategies, and rate limiting per job type. Email has a concurrency of 5 (respects provider limits), while activity processing can handle 20 concurrent jobs.
- **BullMQ over Bull** - BullMQ has better TypeScript support, Redis cluster compatibility, and active maintenance. Bull is the predecessor and is in maintenance mode.
- **Dedicated Redis connection for BullMQ** - BullMQ uses Redis pub/sub for job status notifications. A dedicated connection prevents interference with application-level Redis operations.
- **Job IDs for deduplication** - Scheduled jobs use fixed jobId values. BullMQ prevents duplicate jobs with the same ID, ensuring scheduled jobs don't pile up if a worker is down temporarily.
- **No delayed jobs in MVP** - BullMQ supports delayed jobs, but the MVP uses simpler patterns. Delayed notifications (snooze) can be added in Phase 6.

## Future Considerations

- **Job progress tracking** - For long-running jobs (e.g., bulk import), report progress percentage via `job.updateProgress()`. Frontend shows progress bar for admin operations.
- **Job dependencies** - Chain jobs where analytics runs only after activity processing completes.
- **Priority queues** - Critical notification emails (password reset) are high priority. Newsletter-type emails are low priority.
- **External queue monitoring** - Integrate with Prometheus + Grafana for queue metrics visualization.
