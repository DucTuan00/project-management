# Product Overview

## Purpose
Define the product domain, target users, core features, user stories, and non-functional requirements that govern every architectural decision.

## Domain Model

```
Workspace
  ├── Projects
  │     ├── Tasks
  │     │     ├── Subtasks
  │     │     ├── Comments
  │     │     ├── Attachments
  │     │     ├── Activity Logs
  │     │     └── Assignees
  │     └── Sprints
  │           └── Task associations
  └── Members (users with roles)
```

**Tenancy model**: Workspace-scoped multi-tenancy. Every resource belongs to exactly one workspace. Users can be members of multiple workspaces with independent roles.

## Target Users

| Persona | Typical Role | Key Needs |
|---------|-------------|-----------|
| Individual Developer | Member/Guest | Personal task tracking, Kanban, simple workflows |
| Startup Team | All roles | Fast onboarding, sprint management, realtime updates |
| Software Team | PM/Dev/Member | Full Jira-like workflow, velocity tracking, rich permissions |
| University Project Team | Member | Simple projects, file sharing, due dates |

## Core Features

### Tier 1 (MVP — Phases 1-3)
- Email/password authentication with JWT
- Workspace CRUD and member management
- Project CRUD within workspaces
- Task CRUD with full lifecycle (Backlog to Done)
- Kanban board with drag-and-drop
- Basic RBAC (Owner, Admin, Member, Guest)

### Tier 2 (Standard — Phases 4-5)
- Comments with @mentions
- File attachments (local + S3)
- Sprint management with backlog
- Realtime collaboration (task updates, presence)
- In-app notifications

### Tier 3 (Advanced — Phases 6-8)
- Activity log / audit trail
- Full-text search across tasks
- Dashboard analytics (burndown, velocity, workload)
- Email notifications via BullMQ
- Rate limiting and caching via Redis
- CI/CD pipeline and Docker deployment

## User Stories

### Authentication
- As a user, I want to register with email/password so I can create an account
- As a user, I want to verify my email so my account is secure
- As a user, I want to log in and receive a JWT so I stay authenticated
- As a user, I want to reset my password so I can recover access

### Workspace
- As a user, I want to create a workspace so I can organize my projects
- As a workspace owner, I want to invite members so we can collaborate
- As a workspace admin, I want to manage member roles so access is controlled

### Project
- As a user, I want to create projects within a workspace so work is organized
- As a project manager, I want to configure project settings so workflows match my process

### Tasks
- As a user, I want to create tasks so work is tracked
- As a user, I want to assign tasks to team members so responsibility is clear
- As a user, I want to set task priorities and due dates so deadlines are visible
- As a user, I want to move tasks through statuses so progress is tracked

### Kanban
- As a user, I want to view tasks on a Kanban board so I see workflow state
- As a user, I want to drag tasks between columns so status updates are quick

### Sprint
- As a project manager, I want to create sprints so work is time-boxed
- As a user, I want to add tasks to sprints so workload is planned

### Comments
- As a user, I want to comment on tasks so I can discuss work
- As a user, I want to @mention teammates so they are notified

### Notifications
- As a user, I want to receive notifications so I know when action is needed
- As a user, I want to mark notifications as read so I track what I've seen

## Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Response time (p95) | < 500ms API, < 200ms cached reads |
| Concurrent users per workspace | 500+ |
| Task limit per project | 50,000+ |
| Uptime | 99.9% (post-MVP) |
| Auth token expiry | Access: 15min, Refresh: 7d |
| File upload size | 10MB per file |
| Database backup | Daily automated |

## Design Decisions

- **Monolithic first** — Avoid microservice complexity until traffic patterns demand splitting. Domain boundaries enforced at module level, enabling future extraction.
- **PostgreSQL over MySQL** — Better full-text search, JSONB for flexible metadata, stronger ACID compliance.
- **TypeORM over Prisma** — TypeORM's repository pattern maps well to DDD aggregates; migration system is mature for complex schema evolution.
- **BullMQ over in-process** — Async job processing prevents slow operations (email, notifications) from blocking API responses; provides retry/dead-letter guarantees.

## Future Considerations

- Multi-region deployment with read replicas
- Webhook system for third-party integrations
- Plugin marketplace for custom field types
- GraphQL API for complex query use cases
- Mobile app with offline-first sync
