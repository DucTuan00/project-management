# Notification System

## Purpose
Define the notification system including notification types, delivery channels, read/unread management, and the notification pipeline from event generation to delivery.

## Responsibilities

- Generate notifications from domain events
- Support in-app notification delivery
- Support email notification delivery
- Support realtime push delivery via Socket.IO
- Manage read/unread state with bulk operations
- Provide notification preferences per user

## Notification Types

| Type | Trigger | Channels | Audience |
|------|---------|----------|----------|
| task.assigned | User assigned to task | In-app, Email, Realtime | Assignee |
| task.unassigned | User unassigned | In-app | Former assignee |
| task.status_changed | Task status changes | In-app, Realtime | Task watchers |
| task.due_soon | Task due within 24h | In-app, Email | Assignees |
| task.overdue | Task past due date | In-app, Email | Assignees |
| comment.added | New comment on task | In-app, Realtime | Task watchers |
| comment.mention | User @mentioned | In-app, Email, Realtime | Mentioned user |
| sprint.started | Sprint activated | In-app | Project members |
| sprint.completed | Sprint ended | In-app | Project members |
| member.joined | New workspace member | In-app | Workspace admins |
| member.removed | Member removed | In-app, Email | Removed user |
| project.archived | Project archived | In-app | Project members |
| dependency.completed | Blocking task done | In-app, Realtime | Task assignees |

## Database Model

See [05-database-design.md](05-database-design.md) for the notifications table schema. Key fields: userId + isRead + createdAt composite index, data JSONB for rendering context.

## Notification Pipeline

```
Domain Event (task.assigned)
    |
    v
EventBus.publish(event)
    |
    v
NotificationHandler (sync)
    |  - Determine recipients (assignees, watchers, members)
    |  - Create Notification records in DB
    |  - Bulk insert for multi-recipient
    |
    v
BullMQ: NotificationQueue
    |
    +---> EmailWorker
    |       - Generate email from template
    |       - Send via nodemailer / SendGrid
    |       - Retry on failure
    |
    +---> RealtimeWorker
            - Get recipient's active socket IDs (Redis presence)
            - Emit notification:new to user:<id> room
```

## In-App Notifications

**Listing**: GET /api/v1/notifications?limit=20&offset=0&unreadOnly=true. Ordered by created_at DESC. Each entry has enough data JSONB to render action links.

**Mark as read**: PATCH /api/v1/notifications/:id/read, POST /api/v1/notifications/read-all, POST /api/v1/notifications/read-bulk.

**Unread count**: GET /api/v1/notifications/unread-count returns { count: 5 }. Cached in Redis TTL 30s, invalidated on read mutations.

## Email Notifications

**Frequency**: Instant (immediate send) or Digest (daily/weekly summary via future preferences).

**Instant flow**: NotificationWorker picks up job, determines template, renders with notification data, sends via nodemailer/SendGrid. Retry 3x with exponential backoff, then dead letter.

**Template format**:
```
From: PM Platform <notifications@pmplatform.com>
Subject: [PROJ-42] Jane assigned you to "Implement Stripe checkout"

Hi John,
Jane Doe assigned you to PROJ-42:
  "Implement Stripe checkout"
  Priority: High | Due: Mar 15, 2025
[View Task](https://app.pmplatform.com/project/p-uuid/task/t-uuid)
```

Templates are HTML files in backend/src/jobs/email-templates/ with inlined styles.

## Realtime Notifications

NotificationWorker identifies recipient's active sockets from Redis (key: presence:user:<userId>), emits notification:new to user:<id> room. Frontend appends to TanStack Query cache, increments badge.

**Frontend handling**:
```typescript
socket.on('notification:new', (notification) => {
  queryClient.setQueryData(['notifications', userId], (old) => ({
    pages: [{ data: [notification, ...(old?.pages[0]?.data || [])], unreadCount: (old?.unreadCount || 0) + 1 }]
  }));
});
```

## Notification Preferences

Stored as JSONB in user record:
```json
{
  "email": { "task.assigned": true, "comment.mention": true, "weeklyDigest": false },
  "push": { "task.assigned": true, "comment.mention": true }
}
```

Managed via PATCH /api/v1/user/notification-preferences with Zod validation.

## Read/Unread Strategy

| Operation | SQL |
|-----------|-----|
| Read single | UPDATE SET is_read=true, read_at=NOW() WHERE id=X |
| Read all | UPDATE SET is_read=true WHERE user_id=X AND is_read=false |
| Unread count | SELECT COUNT(*) WHERE user_id=X AND is_read=false |
| Mark unread | UPDATE SET is_read=false, read_at=NULL WHERE id=X (within 5 min) |

Read receipt syncs across tabs via realtime event notification:read on user channel.

## Performance

- Bulk INSERT for multi-recipient notifications
- Cursor-based pagination for large volumes
- 90-day retention, then archive to notifications_archive table

## Design Decisions

- **PostgreSQL storage, not Redis** - Notifications must persist and be queryable. Redis used only for unread count caching.
- **Separate NotificationQueue** - Decouples generation from delivery. If email worker is down, notifications still created and queued.
- **Sufficient data in JSONB** - Enough context to render without additional DB queries.
- **In-app primary, email secondary** - In-app always delivered. Email respects user preferences and rate limiting.

## Future Considerations

- Web Push API for browser notifications when app is backgrounded
- Notification grouping (3 people commented on PROJ-42)
- Snooze for configurable periods
- Custom notification rules for power users
- Weekly email digest
