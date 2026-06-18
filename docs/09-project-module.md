# Project Module

## Purpose
Define the project module including CRUD operations, project key generation, member management, and project-level configuration.

## Responsibilities

- Project creation, reading, updating, soft deletion
- Project key generation and uniqueness within a workspace
- Project member management
- Project settings and workflow configuration
- Project listing with pagination and filtering

## Design Decisions

- **Project key as short identifier** — Projects use a short uppercase key (e.g., `PROJ`, `DEV`) that appears in task IDs (`PROJ-42`). Key is unique within a workspace. Generated from project name or manually specified by the creator.
- **Project lead** — The creator is the initial project lead. The lead has Project Manager permissions by default. Lead can be transferred to another member.
- **Member inheritance** — Project members are explicitly managed. Workspace membership is a prerequisite but does not automatically grant project access. This ensures workspace-level privacy.
- **Project status** — Projects have a status (`active`, `archived`, `frozen`). Archived projects are read-only. Frozen projects hide from default listings.

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | /api/v1/projects | project.create | Create project |
| GET | /api/v1/projects | project.read | List accessible projects |
| GET | /api/v1/projects/:projectId | project.read | Get project details |
| PATCH | /api/v1/projects/:projectId | project.update | Update project |
| DELETE | /api/v1/projects/:projectId | project.delete | Soft-delete project |
| GET | /api/v1/projects/:projectId/members | project.read | List project members |
| POST | /api/v1/projects/:projectId/members | project.manage_members | Add member to project |
| PATCH | /api/v1/projects/:projectId/members/:memberId | project.manage_members | Change member role |
| DELETE | /api/v1/projects/:projectId/members/:memberId | project.manage_members | Remove member |
| GET | /api/v1/projects/:projectId/settings | project.read | Get project settings |
| PATCH | /api/v1/projects/:projectId/settings | project.update | Update project settings |

## Project Key Generation

**Algorithm**:
```
1. If user provides a key: uppercase, trim to 10 chars, strip non-alphanumeric
2. If auto-generating: take first 4 uppercase letters of each word in project name
   "My Awesome Project" → "MAPR"
   "Dev Team" → "DETE"
3. If key exists in workspace: append number ("PROJ" → "PROJ1" → "PROJ2")
4. Validate: only A-Z and 0-9, 2-10 characters
5. Check uniqueness within workspace before creating
```

**Task ID format**: `${projectKey}-${sequentialNumber}` (e.g., `PROJ-42`). Sequential numbers are generated via a counter stored in the project record or a database sequence. Never reuse numbers from deleted tasks.

## Service Methods

### createProject(workspaceId, userId, dto)
1. Verify user has `project.create` permission in workspace
2. Validate input with Zod schema
3. Generate project key if not provided (with uniqueness validation)
4. Start TypeORM transaction
5. Create project with `lead_id = userId`, `workspace_id = workspaceId`
6. Create project_member record: userId + Project Manager role
7. Initialize project settings (default column order, workflow statuses)
8. Create task counter entry (starting at 1)
9. Commit transaction
10. Emit `project.created` event
11. Return project

### listProjects(userId, workspaceId, query)
1. Verify user is workspace member
2. Query projects where:
   - User is project member, OR
   - User is workspace admin/owner (can view all projects in workspace)
3. Apply filters: status, search query, member (by user ID)
4. Support pagination with cursor-based or offset-based
5. Support sorting: name, created_at, updated_at
6. Return projects with member count and task counts (by status)

## Project Settings

Stored as JSONB. Default settings:

```json
{
  "workflow": {
    "columns": [
      { "id": "backlog", "name": "Backlog", "position": 1 },
      { "id": "todo", "name": "To Do", "position": 2 },
      { "id": "in_progress", "name": "In Progress", "position": 3 },
      { "id": "review", "name": "Review", "position": 4 },
      { "id": "done", "name": "Done", "position": 5 }
    ],
    "transitionRules": {
      "backlog": ["todo"],
      "todo": ["in_progress", "backlog"],
      "in_progress": ["review", "todo"],
      "review": ["done", "in_progress"],
      "done": ["archived"]
    }
  },
  "taskDefaults": {
    "type": "task",
    "priority": "medium"
  },
  "board": {
    "hiddenColumns": [],
    "wipLimits": {
      "in_progress": 5,
      "review": 3
    }
  },
  "labels": [
    { "name": "bug", "color": "#ef4444" },
    { "name": "feature", "color": "#3b82f6" },
    { "name": "improvement", "color": "#10b981" }
  ]
}
```

## Project Listing

**Response format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "project-uuid",
      "name": "Project Alpha",
      "key": "ALPHA",
      "description": "Description text",
      "status": "active",
      "lead": { "id": "user-uuid", "displayName": "John Doe" },
      "memberCount": 5,
      "taskCounts": {
        "backlog": 12,
        "todo": 8,
        "in_progress": 3,
        "review": 2,
        "done": 45
      },
      "createdAt": "2025-01-10T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3
  }
}
```

## Member Management

**Adding members to a project**:
1. User must already be a workspace member (not Guest)
2. Select role: Project Manager, Member, or Guest
3. Project lead is added automatically on project creation
4. Members are removed from all open task assignments when removed from project

**Member listing** includes role, the date added, and the number of assigned open tasks.

## Best Practices

1. **Key uniqueness** — Always validate project key uniqueness within the workspace inside the transaction. Use a unique constraint `(key, workspace_id)` to prevent race conditions.
2. **Task ID generation** — Use a dedicated counter table (`project_counters`) rather than `MAX(tasks.sequentialId)`. This avoids race conditions in high-throughput scenarios.
3. **Project cascade on workspace delete** — When a workspace is deleted, all its projects are soft-deleted. The service layer handles this by finding all projects and calling `softRemove` on each.
4. **WIP limits** — Enforced at the controller level, not database. When a user moves a task to a column at WIP limit, return `409 CONFLICT` with `COLUMN_WIP_LIMIT_EXCEEDED`.
5. **Transition rules** — If the project has transition rules configured, validate on the backend (not just frontend) that the status transition is allowed. Return `400 BAD_REQUEST` with `INVALID_STATUS_TRANSITION` if violated.

## Future Considerations

- **Project templates** — Pre-configured project setups (bug tracking, sprint-based development, content calendar) with predefined columns, labels, and workflows.
- **Bulk project operations** — Archive, freeze, or delete multiple projects at once.
- **Cross-project task links** — Reference tasks from other projects with `PROJ-123` syntax. Expand to full task linking with relationship types.
- **Project export** — Export project data (tasks, comments, activity) as CSV or JSON.
