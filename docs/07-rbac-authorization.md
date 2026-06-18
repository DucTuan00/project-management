# RBAC Authorization

## Purpose
Define the role-based access control system including role hierarchy, permission matrix, authorization flow, and enforcement strategy across HTTP and Socket.IO.

## System Roles

Six predefined roles form the RBAC hierarchy. Each role inherits the permissions of all roles below it.

| Role | Level | Scope | Seeded | Deletable |
|------|-------|-------|--------|-----------|
| Super Admin | 100 | Global | Yes | No |
| Workspace Owner | 80 | Workspace | Yes | No |
| Workspace Admin | 60 | Workspace | Yes | No |
| Project Manager | 40 | Project | Yes | No |
| Member | 20 | Project | Yes | No |
| Guest | 10 | Project | Yes | No |

### Role Descriptions

**Super Admin** — Platform-level administrator. Has access to all workspaces, all projects, all settings. Can manage system configuration, view platform-wide analytics, and force-remove workspaces. This role is assigned directly to a user record, not through workspace membership.

**Workspace Owner** — The user who created the workspace. Has full control over workspace settings, member management, billing (future), and all projects within the workspace. The owner cannot be removed from a workspace. Ownership can be transferred.

**Workspace Admin** — Full administrative access within a workspace. Can manage workspace settings, all projects, all members (including role changes), and all tasks. Cannot delete the workspace or transfer ownership.

**Project Manager** — Full access within assigned projects. Can manage project settings, create/modify/delete tasks, manage sprints, manage project members, and configure project workflows. Cannot modify workspace settings or manage workspace members.

**Member** — Standard team member. Can create and edit tasks, add comments, upload attachments, participate in sprints. Cannot modify project settings, manage members, or delete resources they did not create.

**Guest** — Read-only access to assigned projects. Can view tasks and comments, add comments. Cannot create tasks, modify anything, or upload attachments.

## Permission Matrix

### Auth & User
| Permission Code | Super Admin | Workspace Owner | Workspace Admin | Project Manager | Member | Guest |
|----------------|:-----------:|:---------------:|:---------------:|:---------------:|:-----:|:-----:|
| user.manage | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Workspace
| Permission Code | Super Admin | Workspace Owner | Workspace Admin | Project Manager | Member | Guest |
|----------------|:-----------:|:---------------:|:---------------:|:---------------:|:-----:|:-----:|
| workspace.create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| workspace.read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| workspace.update | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| workspace.delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| workspace.manage_members | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Project
| Permission Code | Super Admin | Workspace Owner | Workspace Admin | Project Manager | Member | Guest |
|----------------|:-----------:|:---------------:|:---------------:|:---------------:|:-----:|:-----:|
| project.create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| project.read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| project.update | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| project.delete | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| project.manage_members | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

### Task
| Permission Code | Super Admin | Workspace Owner | Workspace Admin | Project Manager | Member | Guest |
|----------------|:-----------:|:---------------:|:---------------:|:---------------:|:-----:|:-----:|
| task.create | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| task.read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| task.update | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| task.update.assignee | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| task.update.status | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| task.delete | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| task.assign | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### Sprint
| Permission Code | Super Admin | Workspace Owner | Workspace Admin | Project Manager | Member | Guest |
|----------------|:-----------:|:---------------:|:---------------:|:---------------:|:-----:|:-----:|
| sprint.create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| sprint.read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| sprint.update | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| sprint.delete | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| sprint.manage_backlog | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### Comment
| Permission Code | Super Admin | Workspace Owner | Workspace Admin | Project Manager | Member | Guest |
|----------------|:-----------:|:---------------:|:---------------:|:---------------:|:-----:|:-----:|
| comment.create | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| comment.read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| comment.update | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (own only) |
| comment.delete | ✅ | ✅ | ✅ | ✅ | ✅ (own only) | ❌ |

### Attachment
| Permission Code | Super Admin | Workspace Owner | Workspace Admin | Project Manager | Member | Guest |
|----------------|:-----------:|:---------------:|:---------------:|:---------------:|:-----:|:-----:|
| attachment.create | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| attachment.read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| attachment.delete | ✅ | ✅ | ✅ | ✅ | ✅ (own only) | ❌ |

### Notification
| Permission Code | Super Admin | Workspace Owner | Workspace Admin | Project Manager | Member | Guest |
|----------------|:-----------:|:---------------:|:---------------:|:---------------:|:-----:|:-----:|
| notification.read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| notification.update | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Analytics
| Permission Code | Super Admin | Workspace Owner | Workspace Admin | Project Manager | Member | Guest |
|----------------|:-----------:|:---------------:|:---------------:|:---------------:|:-----:|:-----:|
| analytics.view | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

## Permission Seed Data

The `permissions` table is seeded with all permission codes from the matrix above. Each has a `code`, `name`, and `group`. Seed migration runs on initial database setup.

The `role_permissions` table is seeded with all role-permission mappings implied by the matrix. Super Admin gets all permissions. Each subsequent role gets the permissions in their column.

## Authorization Flow

```
Request → AuthGuard (JWT) → RBACGuard (Permission Check)
                                │
                        ┌───────┴───────┐
                        │               │
                  Route requires    Route requires
                  permission?      workspace context?
                        │               │
                        ▼               ▼
                 Check: Does user   Check: Is user
                 have permission    member of workspace?
                 directly?          (workspace_id from
                        │           route param)
                        ▼
                 Check: Does user's  If not → 403
                 role have this
                 permission?
                        │
                  If yes → next()
                  If no → 403 FORBIDDEN
```

### Backend Enforcement Strategy

Three layers of enforcement:

**Layer 1: Global Middleware (AuthGuard)**
- Runs on every authenticated route
- Verifies JWT, attaches `req.user`

**Layer 2: Route-level Guards**
```typescript
// Middleware applied per route or router:
// requirePermission('task.create') — checks role_permissions
// requireWorkspaceMember — checks workspace_members table
// requireProjectMember — checks project_members table
// requireProjectRole('project-manager') — minimum role check
```

**Usage pattern**:
```typescript
// In routes file
router.get('/workspaces/:workspaceId/projects',
  requireWorkspaceMember,
  requirePermission('project.read'),
  projectController.list
);
```

**Layer 3: Service-level Enforcement**
- Services can perform additional checks (resource ownership, etc.)
- Example: Only task creator or project manager can delete a task
- These checks throw `ForbiddenError` with descriptive codes

### Resource Ownership Checks

Some operations require ownership, not just role:

| Resource | Owner Defined By |
|----------|-----------------|
| Task | created_by |
| Comment | author_id |
| Attachment | uploader_id |

Service methods like `deleteComment(commentId, userId)` check ownership before deletion, even if the role permits deletion.

## Custom Roles (Future)

The database schema supports custom roles alongside system roles:
- `roles.is_system = false` for custom roles
- Custom roles are workspace-scoped (`workspace_id` is set)
- Permissions are assigned via `role_permissions` same as system roles
- Workspace Admins can create/manage custom roles from workspace settings

## RBAC in Socket.IO

Socket.IO events are authenticated and authorized:

```typescript
// Socket middleware
io.use(async (socket, next) => {
  // 1. Verify JWT from auth.token (same as HTTP)
  // 2. Store user + roles in socket.data
  // 3. Verify room join permission (must be workspace member)
  next();
});

// Per-event check
socket.use(async ([event, data], next) => {
  if (REQUIRED_PERMISSIONS[event]) {
    const hasPermission = await checkPermission(socket.data.userId, REQUIRED_PERMISSIONS[event]);
    if (!hasPermission) return next(new Error('FORBIDDEN'));
  }
  next();
});
```

## Design Decisions

- **Permission codes as string identifiers** — More readable than numeric enums. Can be extended without migration by adding new rows to the permissions table.
- **Role hierarchy inheritance** — Implemented at the application layer, not database. The service layer looks up the user's role, then checks if the role is at or above the required level.
- **Separate member tables** — `workspace_members` and `project_members` are separate from the JWT user. A user's effective permissions are computed at request time by joining their workspace/project role with the permission matrix.
- **No per-user permission overrides** — Permissions are always assigned to roles, not users. This prevents the permission matrix from becoming unmanageable. Future custom roles handle edge cases.

## Best Practices

1. **Fail closed** — If permission check throws or returns undefined, deny access (403).
2. **Check at the right granularity** — Workspace-level checks at middleware, resource-level checks in services.
3. **Cache permission lookups** — User permissions change infrequently. Cache in Redis with TTL of 5 minutes. Invalidate on role change.
4. **Log authorization failures** — All 403 responses are logged with user ID, resource, and attempted action for audit.

## Future Considerations

- **ABAC (Attribute-Based Access Control)** — For fine-grained rules like "only the project lead can move tasks to Done". This can be added alongside RBAC without changing the core permission system.
- **Permission audit log** — Track when roles or permissions change, who made the change, and what changed.
- **Bulk permission assignment** — API for adding/removing multiple permissions to a role in one request.
