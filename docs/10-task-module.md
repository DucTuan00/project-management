# Task Module

## Purpose
Define the task module including the full task lifecycle, priority system, task relationships (parent/child/dependency), and the task creation/update/deletion flows.

## Responsibilities

- Task creation, reading, updating, soft deletion
- Task status transitions through the lifecycle
- Priority management
- Parent-child (subtask) relationships
- Task dependency tracking
- Task assignment to users
- Sequential ID generation within a project

## Task Lifecycle

```
                    +---> Archived
                    |
    +--------+    +------+    +-----------+    +------+    +------+
    | Backlog|--->| Todo |--->| In Progress|--->|Review|--->| Done |
    +--------+    +------+    +-----------+    +------+    +------+
       |             |              |              |           |
       |             |              |              |           |
       +<------------+<-------------+<-------------+           |
                                                               |
                                                          [Completed]
```

**Status definitions**:

| Status | Description | Color | Default column |
|--------|-------------|-------|---------------|
| backlog | Task identified but not ready for work | #6b7280 | Backlog |
| todo | Task ready for work, not started | #3b82f6 | To Do |
| in_progress | Work actively being done | #f59e0b | In Progress |
| review | Work complete awaiting review | #8b5cf6 | Review |
| done | Work verified complete | #10b981 | Done |
| archived | Removed from active workflow | #9ca3af | Hidden |

**Transition rules** (default, customizable per project):
- From backlog: todo
- From todo: in_progress, backlog
- From in_progress: review, todo
- From review: done, in_progress
- From done: archived
- From archived: none (must be unarchived by admin)

Invalid transitions return 400 BAD_REQUEST with code INVALID_STATUS_TRANSITION.

## Task Priorities

| Priority | Level | Color | SLA (future) |
|----------|-------|-------|--------------|
| low | 0 | #22c55e | No SLA |
| medium | 1 | #3b82f6 | Default |
| high | 2 | #f59e0b | 48h response |
| critical | 3 | #ef4444 | 4h response |

**Priority escalation**: If a task's due date is within 24 hours and priority is not at least high, the system automatically escalates priority to high (configurable per project).

## Task Types

| Type | Description | Icon |
|------|-------------|------|
| task | General work item | Checkbox |
| bug | Defect or issue | Bug |
| story | User story | Book |
| epic | Large body of work | Flag |

## Task Relationships

### Parent-Child (Subtask)

- A task can have one parent task (parent_task_id FK to tasks.id)
- A parent can have many children
- Subtasks inherit the project and workspace from the parent
- When a parent is deleted, all subtasks are also soft-deleted
- A subtask cannot have its own subtasks (one level deep only)
- 1:N relationship, not M:N

### Task Dependencies

Dependencies are tracked in a separate join table:

**task_dependencies**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| task_id | UUID | FK to tasks.id (depends on) |
| depends_on_task_id | UUID | FK to tasks.id (dependency target) |
| type | VARCHAR(20) | DEFAULT blocks |
| created_at | TIMESTAMP | DEFAULT NOW() |

**Dependency types**:
- blocks - Task A blocks Task B (B cannot start until A is done)
- relates_to - Tasks are related (informational)

**Rules**:
- A task cannot depend on itself
- Circular dependencies are detected on creation and rejected with CIRCULAR_DEPENDENCY error
- A task with uncompleted dependencies cannot be moved to in_progress or done
- When a dependency is completed, notify relevant task assignees

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | /api/v1/projects/:projectId/tasks | task.create | Create task |
| GET | /api/v1/projects/:projectId/tasks | task.read | List tasks |
| GET | /api/v1/tasks/:taskId | task.read | Get task details |
| PATCH | /api/v1/tasks/:taskId | task.update | Update task |
| DELETE | /api/v1/tasks/:taskId | task.delete | Soft-delete task |
| POST | /api/v1/tasks/:taskId/assign | task.assign | Assign users |
| DELETE | /api/v1/tasks/:taskId/assign/:userId | task.assign | Remove assignee |
| POST | /api/v1/tasks/:taskId/dependencies | task.update | Add dependency |
| DELETE | /api/v1/tasks/:taskId/dependencies/:depId | task.update | Remove dependency |
| POST | /api/v1/tasks/:taskId/status | task.update.status | Change status |
| PATCH | /api/v1/tasks/:taskId/position | task.update | Update position |

## Service Methods

### createTask(projectId, userId, dto)
1. Verify user has task.create permission in project
2. Validate input with Zod schema
3. Generate sequential ID (SELECT counter + UPDATE counter in transaction)
4. If parent_task_id provided: verify parent exists, is not a subtask (only one level)
5. Calculate position: set to end of the target column (max position + 10000)
6. If sprint_id provided: verify sprint exists and is in planning/active status
7. Create task record
8. If assignees provided: create task_assignees records
9. Emit task.created event + activity log + notification to assignees
10. Return task with assignees

### updateTask(taskId, userId, dto)
1. Verify user has task.update permission
2. Fetch task (include deletedAt: IsNull())
3. If not found: return 404 NOT_FOUND
4. Validate dto with Zod schema (partial update allowed)
5. If status change: validate transition, check dependencies (see statusChange rules)
6. Capture changes for activity log (before/after diff)
7. Save changes
8. Emit task.updated event + activity log + realtime update
9. Return updated task

### deleteTask(taskId, userId)
1. Verify user has task.delete permission
2. Fetch task
3. Soft-delete task (TypeORM softRemove)
4. Soft-delete all subtasks, comments, attachments
5. Remove all task_assignees records
6. Emit task.deleted event + activity log

## Position / Ordering

Position is managed via fractional indexing. See [11-kanban-board.md](11-kanban-board.md) for the detailed algorithm.

Tasks maintain a `position` field (DECIMAL 12,2) scoped to their project. When tasks move between columns or within a column, their position is recalculated. This is used for both the Kanban view and the backlog/sprint view ordering.

## Sequential ID Generation

Each project has a counter stored in a `project_counters` table:

```sql
CREATE TABLE project_counters (
  project_id UUID PRIMARY KEY REFERENCES projects(id),
  last_sequential_id INTEGER NOT NULL DEFAULT 0
);
```

On task creation:
1. BEGIN transaction
2. UPDATE project_counters SET last_sequential_id = last_sequential_id + 1 WHERE project_id = X RETURNING last_sequential_id
3. Use returned value as task.sequential_id
4. INSERT task with sequential_id
5. COMMIT

The task display ID is formatted as `${projectKey}-${sequentialId}`. This is computed at read time (not stored).

## Activity Log Integration

Every task mutation emits an activity log entry. The payload format:

| Action | Changes Format |
|--------|---------------|
| task.created | null |
| task.updated | { "title": { "from": "Old", "to": "New" } } |
| task.status_changed | { "status": { "from": "todo", "to": "in_progress" } } |
| task.assigned | { "assignees": { "added": ["user-id"], "removed": ["user-id"] } } |
| task.deleted | null |

## Best Practices

1. **Status transitions validated server-side** - Frontend may allow it, but backend always validates transitions and dependencies.
2. **Position recalculation batching** - When reordering many tasks in one request (e.g., drag across columns), update all positions in a single UPDATE with CASE statement.
3. **Task detail includes aggregates** - GET /tasks/:id returns subtask count, comment count, attachment count, and last 10 activity log entries as nested data.
4. **Cache task counts per project** - Task counts by status are cached in Redis with TTL 30s, invalidated on any task mutation in that project.
5. **Metadata JSONB** - Custom fields from project settings are stored in metadata. The project defines which fields exist; the task stores values. No schema enforcement at DB level - validated by Zod per project.

## Future Considerations

- **Bulk task operations** - Move/delete/assign multiple tasks at once via a single API call with array of task IDs.
- **Task templates** - Predefined task structures with default fields, checklists, and descriptions.
- **Time tracking** - Start/stop timer on tasks, aggregated per user per sprint.
- **Recurring tasks** - Tasks that auto-create on a schedule (daily standup, weekly report).
