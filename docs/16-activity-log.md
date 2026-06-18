# Activity Log

## Purpose
Define the activity log module that records all significant state changes as an immutable audit trail, and provides query capabilities for the activity feed.

## Responsibilities

- Record all domain events as activity log entries
- Capture before/after state diffs for tracked changes
- Provide paginated activity feeds per entity (workspace, project, task)
- Support filtering by action type and actor
- Maintain append-only semantics (no delete, no update)
- Feed realtime activity stream to connected clients

## Data Model

See [05-database-design.md](05-database-design.md) for the activity_logs table schema.

Key design properties:
- **Append-only**: Once written, activity logs are never modified or deleted
- **Denormalized**: The `metadata` JSONB contains enough context to render the activity item without joins
- **Entity-scoped**: Each entry has workspace_id, project_id, and task_id (nullable) for efficient scoped queries

## Activity Entry Structure

```json
{
  "id": "log-uuid",
  "workspaceId": "ws-uuid",
  "projectId": "proj-uuid",
  "taskId": "task-uuid",
  "actorId": "user-uuid",
  "action": "task.status_changed",
  "entityType": "task",
  "entityId": "task-uuid",
  "changes": {
    "status": { "from": "in_progress", "to": "review" }
  },
  "metadata": {
    "taskTitle": "Implement Stripe checkout",
    "projectKey": "PROJ",
    "taskSequentialId": 42
  },
  "createdAt": "2025-01-15T10:30:00Z"
}
```

## Actions Catalog

Every significant domain action maps to an activity log action code:

| Action Code | Entity | Description |
|-------------|--------|-------------|
| workspace.created | workspace | Workspace created |
| workspace.updated | workspace | Workspace settings changed |
| workspace.deleted | workspace | Workspace soft-deleted |
| workspace.member.added | workspace_member | Member added to workspace |
| workspace.member.removed | workspace_member | Member removed |
| workspace.member.role_changed | workspace_member | Member role changed |
| project.created | project | Project created |
| project.updated | project | Project settings changed |
| project.deleted | project | Project soft-deleted |
| project.member.added | project_member | Member added to project |
| project.member.removed | project_member | Member removed |
| task.created | task | Task created |
| task.updated | task | Task title/description/etc changed |
| task.status_changed | task | Task status/column changed |
| task.assigned | task | User(s) assigned to task |
| task.unassigned | task | User(s) removed from task |
| task.priority_changed | task | Priority changed |
| task.deleted | task | Task soft-deleted |
| sprint.created | sprint | Sprint created |
| sprint.started | sprint | Sprint activated |
| sprint.completed | sprint | Sprint completed |
| sprint.task.added | sprint | Task added to sprint |
| sprint.task.removed | sprint | Task removed from sprint |
| comment.created | comment | Comment added |
| comment.updated | comment | Comment edited |
| comment.deleted | comment | Comment soft-deleted |
| attachment.created | attachment | File uploaded |
| attachment.deleted | attachment | File removed |

## Recording Activity

Activity logs are recorded synchronously via the EventBus:

```typescript
// In the shared EventBus handler registration:
eventBus.subscribe('*', async (event: DomainEvent) => {
  const activityEntry = {
    workspaceId: event.metadata.workspaceId,
    projectId: event.metadata.projectId,
    taskId: event.metadata.taskId,
    actorId: event.metadata.userId,
    action: event.name,
    entityType: event.aggregateType,
    entityId: event.aggregateId,
    changes: event.payload.changes || null,
    metadata: event.payload.metadata || {},
  };

  await activityLogRepository.create(activityEntry);
});
```

The synchronous handler ensures activity logs are written within the same database transaction as the triggering action. If the activity log write fails, the entire operation rolls back. This guarantees audit trail completeness.

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | /api/v1/workspaces/:workspaceId/activity | workspace.read | Workspace-level activity feed |
| GET | /api/v1/projects/:projectId/activity | project.read | Project-level activity feed |
| GET | /api/v1/tasks/:taskId/activity | task.read | Task-level activity feed |

## Activity Feed Queries

**Workspace activity**:
```
GET /api/v1/workspaces/:workspaceId/activity?limit=20&offset=0&action=task.*&actorId=uuid
```
Returns recent activity across all projects in the workspace. Used for the dashboard activity feed.

**Project activity**:
```
GET /api/v1/projects/:projectId/activity?limit=20&before=cursor
```
Returns activity for a specific project. Cursor-based pagination using created_at.

**Task activity**:
```
GET /api/v1/tasks/:taskId/activity?limit=50
```
Returns full history of a task. Used in the task detail sidebar.

**Filters**:
- `action` - Filter by action code or glob pattern (e.g., `task.*`)
- `actorId` - Filter by user
- `entityType` - Filter by entity type
- `dateFrom` / `dateTo` - Date range filter
- `search` - Full-text search within metadata

## Activity Feed Rendering

The frontend renders activity entries based on action type:

| Action | Display |
|--------|---------|
| task.created | John created PROJ-42 |
| task.status_changed | John moved PROJ-42 from In Progress to Review |
| task.assigned | John assigned Jane to PROJ-42 |
| comment.created | John commented on PROJ-42 |
| comment.mention | John mentioned Jane in PROJ-42 |

Each display line links to the relevant resource (task, project, etc.). The format is derived from the action code and the metadata JSONB.

## Performance Considerations

**Write throughput**: Activity logs are high-write-volume. Mitigations:
- Batch inserts when multiple log entries are generated from a single event
- The activity_logs table has no foreign key constraints on entity_id (UUID is stored but not enforced by FK) to avoid constraint checks on writes
- No UPDATE triggers on the table

**Read queries**: Activity feeds are queried frequently. Mitigations:
- Composite indexes on (project_id, created_at) and (workspace_id, created_at)
- Limit results to 50 per page maximum
- Activity feeds older than 24h can be cached with Redis for 5 minutes

**Data retention**: Activity logs are retained indefinitely for the audit trail. After 12 months, entries are moved to a partitioned archive table.

## Design Decisions

- **Synchronous recording** - Activity logs are written in the same transaction as the action. This ensures that the audit trail is always complete. The slight latency cost is acceptable because activity log writes are fast (single INSERT with no FK checks).
- **Denormalized metadata** - Storing task title and project key in the metadata field avoids N+1 queries when rendering activity feeds. The trade-off is data duplication if a task is renamed - older activity entries still show the old title.
- **No hard deletes** - Activity logs are never deleted. This is intentional for audit compliance. If data privacy requirements demand deletion, a separate GDPR cleanup job can selectively remove entries by actor_id.
- **Action code as string** - Human-readable action codes (`task.status_changed`) are easier to work with than numeric enums and can be extended without migrations.

## Future Considerations

- **Activity aggregation** - Group repeated actions ("John moved PROJ-42 5 times") into a single entry with count.
- **Revert from activity** - Click "Revert" on an activity entry to undo the change (stored as a new activity entry).
- **CSV export** - Export activity log as CSV for compliance/audit reporting.
- **Admin activity view** - Platform-wide activity feed for Super Admins with cross-workspace search.
