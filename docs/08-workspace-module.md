# Workspace Module

## Purpose
Define the workspace module including CRUD operations, member management, invitation flow, and workspace-level configuration.

## Responsibilities

- Workspace creation, reading, updating, soft deletion
- Member invitation and removal
- Role assignment for members
- Workspace slug generation and uniqueness
- Workspace-level settings management
- Member listing with pagination and filtering

## Design Decisions

- **Slug as URL identifier** — Workspaces are identified by slug in URLs (`/workspace/acme-corp`) rather than UUID. Slug is generated from workspace name with deduplication suffix (e.g., `acme-corp`, `acme-corp-2`).
- **Creator becomes Owner** — The user who creates a workspace is automatically assigned the Workspace Owner role. This is done in a transaction — user creation and membership creation succeed or fail together.
- **Invitation flow** — New members are added via email invitation regardless of whether the email belongs to an existing user. The system handles both cases:
  - **Existing user**: creates workspace_members record immediately, sends notification
  - **New user**: creates a pending membership, sends welcome email with registration link that includes an invite token
- **Soft delete cascade** — Soft-deleting a workspace soft-deletes all projects, tasks, and related data. This is handled via TypeORM cascade or manual service-level cascade.

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | /api/v1/workspaces | authenticated | Create workspace |
| GET | /api/v1/workspaces | authenticated | List user's workspaces |
| GET | /api/v1/workspaces/:workspaceId | workspace.read | Get workspace details |
| PATCH | /api/v1/workspaces/:workspaceId | workspace.update | Update workspace |
| DELETE | /api/v1/workspaces/:workspaceId | workspace.delete | Soft-delete workspace |
| GET | /api/v1/workspaces/:workspaceId/members | workspace.read | List members |
| POST | /api/v1/workspaces/:workspaceId/members | workspace.manage_members | Add/invite member |
| PATCH | /api/v1/workspaces/:workspaceId/members/:memberId | workspace.manage_members | Change member role |
| DELETE | /api/v1/workspaces/:workspaceId/members/:memberId | workspace.manage_members | Remove member |
| POST | /api/v1/workspaces/:workspaceId/transfer | workspace.delete | Transfer ownership |
| GET | /api/v1/workspaces/:workspaceId/settings | workspace.read | Get workspace settings |
| PATCH | /api/v1/workspaces/:workspaceId/settings | workspace.update | Update workspace settings |

## Service Methods

### createWorkspace(userId, dto)
1. Validate input with Zod schema
2. Generate slug from `dto.name` (slugify + deduplicate)
3. Start TypeORM transaction
4. Create workspace with `owner_id = userId`
5. Create workspace_member record: userId + Workspace Owner role
6. Create default roles for workspace (clone from system role templates)
7. Commit transaction
8. Emit `workspace.created` event
9. Return workspace

### inviteMember(workspaceId, inviterId, dto)
1. Verify inviter has `workspace.manage_members` permission
2. Validate email format
3. Find or create user by email
4. If already a member → return 409 CONFLICT
5. Create workspace_members record with default Member role
6. If user exists: emit notification
7. If new user: enqueue welcome email with invite link
8. Return membership

### updateMemberRole(workspaceId, memberId, newRoleId)
1. Verify actor has `workspace.manage_members` permission
2. Cannot change the Owner's role (owner cannot be demoted)
3. Cannot set a role higher than the actor's own role
4. Update role_id on workspace_members record
5. Emit `workspace.member.role_changed` event
6. Return updated member

## Member Management

**List members response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "member-uuid",
      "userId": "user-uuid",
      "email": "user@example.com",
      "displayName": "John Doe",
      "avatarUrl": null,
      "role": "workspace_admin",
      "joinedAt": "2025-01-15T10:00:00Z",
      "isPending": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

**Role change rules**:
- Workspace Owner can change any member's role (except their own ownership)
- Workspace Admin can change roles of members with lower role levels
- No one can demote a user to a role lower than their current role (prevents accidental lockout)
- A role change that grants workspace.admin or workspace.owner requires confirmation

## Ownership Transfer

**Flow**:
1. New owner must be an existing workspace member
2. Current owner's role is downgraded to Workspace Admin
3. Target user's role is upgraded to Workspace Owner
4. Workspace `owner_id` field is updated
5. Old owner cannot be removed for 7 days after transfer (safety window)
6. Both users receive notification

## Workspace Settings

Stored as JSONB in the workspace record. Seeded with defaults on creation.

```json
{
  "features": {
    "sprints": true,
    "timeTracking": false,
    "kanban": true
  },
  "projectDefaults": {
    "defaultAssignee": "unassigned",
    "taskStatuses": ["backlog", "todo", "in_progress", "review", "done", "archived"]
  },
  "notifications": {
    "emailDigest": "daily",
    "pushEnabled": true
  }
}
```

Settings are validated with a Zod schema before update. Unknown keys are stripped.

## Best Practices

1. **Slug generation** — Use a slugify library that handles Unicode. Append `-2`, `-3`, etc. for conflicts. Check uniqueness in a loop with a uniqueness constraint (retry if race condition).
2. **Member limits** — Check workspace member count against plan limits before adding new members. Return 403 with `WORKSPACE_MEMBER_LIMIT_REACHED` if exceeded.
3. **Exit cleanup** — When a member is removed, also remove them from all project_members in that workspace. Unassign them from open tasks.
4. **Ownership guard** — The workspace owner check is a TypeORM `FindOptionsWhere` condition, not an application check: `{ id: workspaceId, ownerId: userId }` prevents race conditions.
5. **Cascade delete rationale** — Soft-delete cascading is done in the service layer (not database cascade) to ensure proper event emission and audit log entries for each deleted entity.

## Future Considerations

- **Bulk invite** — Accept an array of emails in a single request. Process as a BullMQ job with progress tracking.
- **Workspace archiving** — Archived workspaces are frozen (read-only). Members can still view data but cannot modify anything. Separate from soft-delete.
- **SSO enforcement** — For enterprise workspaces, enforce SAML/OIDC login. Disable password-based login for members.
- **Billing integration** — Workspace plan (Free/Pro/Enterprise) stored in settings. Stripe customer ID linked to workspace owner.
