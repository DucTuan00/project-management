# Database Design

## Purpose
Define the database schema, entity relationships, indexing strategy, soft-delete approach, and audit trail design. This document is the source of truth for all database migrations.

## Entity-Relationship Diagram

```
users --- workspace_members --- workspaces
  |               |                   |
  |               |                   +--- projects
  |               |                   |     +--- tasks
  |               |                   |     |     +--- task_assignees
  |               |                   |     |     +--- comments
  |               |                   |     |     +--- attachments
  |               |                   |     |     +--- activity_logs
  |               |                   |     +--- project_members
  |               |                   |
  |               |                   +--- sprints
  |               |                         +--- tasks (via sprint_id)
  |               |
  |               roles --- role_permissions --- permissions
```

## Entity Definitions

### users

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid_generate_v4() | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Lowercase, trimmed |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash |
| display_name | VARCHAR(100) | NOT NULL | |
| avatar_url | VARCHAR(500) | NULLABLE | |
| is_email_verified | BOOLEAN | DEFAULT false | |
| email_verified_at | TIMESTAMP | NULLABLE | |
| last_login_at | TIMESTAMP | NULLABLE | |
| refresh_token_hash | VARCHAR(255) | NULLABLE | For token rotation |
| password_reset_token | VARCHAR(255) | NULLABLE | |
| password_reset_expires | TIMESTAMP | NULLABLE | |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete |

**Indexes**: UNIQUE on email, index on deleted_at

### workspaces

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| name | VARCHAR(200) | NOT NULL | |
| slug | VARCHAR(200) | UNIQUE, NOT NULL | URL-friendly |
| description | TEXT | NULLABLE | |
| logo_url | VARCHAR(500) | NULLABLE | |
| owner_id | UUID | FK to users.id | |
| settings | JSONB | DEFAULT {} | Feature flags, config |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |
| deleted_at | TIMESTAMP | NULLABLE | |

**Indexes**: UNIQUE on slug, index on owner_id

### workspace_members

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| workspace_id | UUID | FK to workspaces.id | |
| user_id | UUID | FK to users.id | |
| role_id | UUID | FK to roles.id | |
| invited_by | UUID | FK to users.id | |
| joined_at | TIMESTAMP | NULLABLE | NULL if invite pending |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| deleted_at | TIMESTAMP | NULLABLE | |

**Indexes**: UNIQUE on (workspace_id, user_id), index on user_id

### roles

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| name | VARCHAR(50) | NOT NULL | System or custom |
| description | VARCHAR(255) | NULLABLE | |
| is_system | BOOLEAN | DEFAULT false | System roles cannot be deleted |
| workspace_id | UUID | FK to workspaces.id | NULL for global roles |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |
| deleted_at | TIMESTAMP | NULLABLE | |

**Indexes**: UNIQUE on (name, workspace_id)

### permissions

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| code | VARCHAR(100) | UNIQUE, NOT NULL | e.g., task.create |
| name | VARCHAR(200) | NOT NULL | Human-readable |
| group | VARCHAR(50) | NOT NULL | e.g., tasks, projects |
| description | VARCHAR(255) | NULLABLE | |
| created_at | TIMESTAMP | DEFAULT NOW() | |

30+ permissions seeded covering all CRUD operations per module.

### role_permissions

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| role_id | UUID | FK to roles.id | |
| permission_id | UUID | FK to permissions.id | |

**Indexes**: UNIQUE on (role_id, permission_id)

### projects

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| workspace_id | UUID | FK to workspaces.id | |
| name | VARCHAR(200) | NOT NULL | |
| key | VARCHAR(10) | NOT NULL | Short code: PROJ, DEV |
| description | TEXT | NULLABLE | |
| lead_id | UUID | FK to users.id | Project lead |
| status | VARCHAR(20) | DEFAULT active | active, archived, frozen |
| settings | JSONB | DEFAULT {} | Workflow config, column order |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |
| deleted_at | TIMESTAMP | NULLABLE | |

**Indexes**: index on workspace_id, UNIQUE on (key, workspace_id)

### project_members

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| project_id | UUID | FK to projects.id | |
| user_id | UUID | FK to users.id | |
| role_id | UUID | FK to roles.id | |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| deleted_at | TIMESTAMP | NULLABLE | |

**Indexes**: UNIQUE on (project_id, user_id)

### sprints

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| project_id | UUID | FK to projects.id | |
| name | VARCHAR(200) | NOT NULL | Sprint 1, Sprint 2 |
| goal | TEXT | NULLABLE | Sprint goal |
| status | VARCHAR(20) | DEFAULT planning | planning, active, completed |
| start_date | DATE | NOT NULL | |
| end_date | DATE | NOT NULL | |
| completed_at | TIMESTAMP | NULLABLE | |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |
| deleted_at | TIMESTAMP | NULLABLE | |

**Indexes**: index on project_id, index on status

### tasks

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| project_id | UUID | FK to projects.id | |
| sprint_id | UUID | FK to sprints.id | NULLABLE |
| parent_task_id | UUID | FK to tasks.id | NULLABLE for subtasks |
| sequential_id | INTEGER | NOT NULL | Human-readable PROJ-42 |
| title | VARCHAR(500) | NOT NULL | |
| description | TEXT | NULLABLE | Markdown content |
| status | VARCHAR(30) | DEFAULT backlog | backlog, todo, in_progress, review, done, archived |
| priority | VARCHAR(10) | DEFAULT medium | low, medium, high, critical |
| type | VARCHAR(20) | DEFAULT task | task, bug, story, epic |
| story_points | INTEGER | NULLABLE | Fibonacci |
| due_date | TIMESTAMP | NULLABLE | |
| estimated_hours | DECIMAL(7,2) | NULLABLE | |
| actual_hours | DECIMAL(7,2) | NULLABLE | |
| position | DECIMAL(12,2) | NOT NULL | Fractional index for ordering |
| board_column_id | VARCHAR(30) | DEFAULT backlog | Column for Kanban |
| metadata | JSONB | DEFAULT {} | Custom fields, labels |
| created_by | UUID | FK to users.id | |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |
| deleted_at | TIMESTAMP | NULLABLE | |

**Indexes**: composite on (project_id, status), composite on (project_id, position), index on sprint_id, index on parent_task_id

### task_assignees

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| task_id | UUID | FK to tasks.id | |
| user_id | UUID | FK to users.id | |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**Indexes**: UNIQUE on (task_id, user_id)

### comments

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| task_id | UUID | FK to tasks.id | |
| parent_id | UUID | FK to comments.id | NULLABLE for threaded replies |
| author_id | UUID | FK to users.id | |
| content | TEXT | NOT NULL | Markdown content |
| mentions | UUID[] | DEFAULT {} | Array of mentioned user IDs |
| edited_at | TIMESTAMP | NULLABLE | |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| deleted_at | TIMESTAMP | NULLABLE | |

**Indexes**: index on task_id, index on parent_id, index on author_id

### attachments

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| task_id | UUID | FK to tasks.id | |
| comment_id | UUID | FK to comments.id | NULLABLE |
| uploader_id | UUID | FK to users.id | |
| file_name | VARCHAR(255) | NOT NULL | Original filename |
| file_size | INTEGER | NOT NULL | Bytes |
| mime_type | VARCHAR(100) | NOT NULL | |
| storage_path | VARCHAR(500) | NOT NULL | Path on disk or S3 key |
| storage_type | VARCHAR(10) | DEFAULT local | local, s3 |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| deleted_at | TIMESTAMP | NULLABLE | |

**Indexes**: index on task_id

### notifications

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK to users.id | Recipient |
| type | VARCHAR(50) | NOT NULL | task_assigned, comment_mention |
| title | VARCHAR(500) | NOT NULL | |
| body | TEXT | NULLABLE | |
| data | JSONB | DEFAULT {} | Metadata for rendering |
| is_read | BOOLEAN | DEFAULT false | |
| read_at | TIMESTAMP | NULLABLE | |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**Indexes**: composite on (user_id, is_read), index on created_at

### activity_logs

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| workspace_id | UUID | FK to workspaces.id | |
| project_id | UUID | FK to projects.id | NULLABLE |
| task_id | UUID | FK to tasks.id | NULLABLE |
| actor_id | UUID | FK to users.id | |
| action | VARCHAR(50) | NOT NULL | task.created, comment.added |
| entity_type | VARCHAR(30) | NOT NULL | task, comment, project |
| entity_id | UUID | NOT NULL | |
| changes | JSONB | NULLABLE | Before/after diffs |
| metadata | JSONB | DEFAULT {} | Extra context |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**Indexes**: composite on (project_id, created_at), index on task_id, composite on (workspace_id, created_at)

## Relationships Summary

| Parent | Child | Type | FK Column |
|--------|-------|------|-----------|
| users | workspace_members | 1:N | user_id |
| users | projects (lead) | 1:N | lead_id |
| workspaces | workspace_members | 1:N | workspace_id |
| workspaces | projects | 1:N | workspace_id |
| workspaces | roles | 1:N | workspace_id |
| projects | tasks | 1:N | project_id |
| projects | sprints | 1:N | project_id |
| projects | project_members | 1:N | project_id |
| tasks | comments | 1:N | task_id |
| tasks | attachments | 1:N | task_id |
| tasks | activity_logs | 1:N | task_id |
| tasks | task_assignees | 1:N | task_id |
| tasks | tasks (subtask) | 1:N | parent_task_id |
| sprints | tasks | 1:N | sprint_id |
| users | notifications | 1:N | user_id |

## Soft Delete Strategy

Every entity with a deleted_at column uses TypeORM @DeleteDateColumn().

**Query convention**: All repository find methods include where: { deletedAt: IsNull() } by default. TypeORM soft deletes set deleted_at timestamp. Hard deletes are never used in application code.

**Cascade behavior**: When a workspace is soft-deleted, all child projects, tasks, comments, etc. are also soft-deleted via application-level cascading in the service layer.

## Audit Fields

Every entity includes created_at (set once), updated_at (updated on change via @UpdateDateColumn()), deleted_at (set on soft delete). Changes are tracked in activity_logs with before/after JSON diffs. The activity_logs table is append-only.

## Indexing Strategy

| Pattern | Index Type | Example |
|---------|-----------|---------|
| Lookup by FK | B-tree | tasks.project_id |
| Unique constraint | UNIQUE B-tree | users.email |
| Sort order | B-tree | notifications.created_at |
| Composite filter | B-tree | tasks (project_id, status) |
| Position ordering | B-tree | tasks (project_id, position) |
| Full-text search | GIN | On task title + description (Phase 7) |

## Design Decisions

- **UUID over serial** — Prevents ID enumeration, simplifies future sharding, allows client-side ID generation for offline-capable features.
- **JSONB for settings/metadata** — Flexible schema for per-workspace and per-project settings without migrations.
- **Fractional indexing for positions** — Using decimal positions (1.0, 2.0) and inserting between by averaging enables O(1) reordering. No large UPDATE statements needed.
- **Role-based permissions stored relationally** — The roles to role_permissions to permissions chain enables custom roles without hard-coding.
- **Separate task_assignees table** — Tasks can have multiple assignees. A user_id column on tasks would limit to one assignee.
- **Array column for mentions** — UUID[] on comments for @mentions avoids a join table for a simple array of user IDs.

## Future Considerations

- **Partitioning** — activity_logs and notifications grow fastest. Consider monthly range partitioning after 10M+ rows.
- **Read replicas** — Analytics queries can be routed to a read replica.
- **Materialized views** — Dashboard metrics can be served from materialized views refreshed by BullMQ jobs.
