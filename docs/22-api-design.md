# API Design

## Purpose
Define the REST API conventions including URL structure, versioning, error handling, pagination, filtering, sorting, and standard response formats.

## Base URL

```
Development: http://localhost:3001/api/v1
Production:  https://api.pmplatform.com/api/v1
```

## API Versioning

**Strategy**: URL path versioning (`/api/v1/`, `/api/v2/`).

- The version is embedded in the URL path
- Version is a simple integer (v1, v2, etc.)
- Breaking changes require a new version
- Older versions are maintained for at least 6 months after deprecation
- Deprecation is communicated via the `Deprecation` response header

## REST Conventions

| HTTP Method | Convention | Description |
|-------------|------------|-------------|
| GET | /resources | List resources |
| GET | /resources/:id | Get single resource |
| POST | /resources | Create resource |
| PATCH | /resources/:id | Partial update |
| DELETE | /resources/:id | Delete resource |
| POST | /resources/:id/action | Custom action |

**Naming conventions**:
- Resources are plural nouns: `/workspaces`, `/projects`, `/tasks`
- Nested resources use path: `/projects/:projectId/tasks`
- Custom actions use verb after resource: `/tasks/:taskId/assign`
- Query parameters are lowercase snake_case

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "pagination": {    // Only for list endpoints
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task with id 'abc-123' not found",
    "details": null
  },
  "requestId": "req-abc-123"
}
```

The `error.code` field is a machine-readable string for programmatic handling. The `error.message` is human-readable. The `details` field contains validation errors or additional context.

## Standard HTTP Status Codes

| Code | Description | When to Use |
|------|-------------|-------------|
| 200 | OK | Successful GET, PATCH, DELETE, POST (synchronous) |
| 201 | Created | Successful POST that creates a resource |
| 204 | No Content | DELETE success (no body returned) |
| 400 | Bad Request | Validation failure, malformed input |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate resource, WIP limit exceeded |
| 422 | Unprocessable | Business rule violation (status transition) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

## Error Response Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Zod validation failed |
| INVALID_CREDENTIALS | 401 | Email/password mismatch |
| TOKEN_EXPIRED | 401 | Access token expired |
| TOKEN_INVALID | 401 | Access token malformed or blacklisted |
| FORBIDDEN | 403 | User lacks permission |
| NOT_FOUND | 404 | Resource not found |
| EMAIL_ALREADY_EXISTS | 409 | Registration with existing email |
| COLUMN_WIP_LIMIT_EXCEEDED | 409 | Kanban column at capacity |
| INVALID_STATUS_TRANSITION | 422 | Task status change not allowed |
| CIRCULAR_DEPENDENCY | 422 | Task dependency creates a cycle |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Unexpected server error |

## Pagination

### Offset-based (default)
```
GET /api/v1/projects/:id/tasks?page=1&limit=20
```

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| page | 1 | 100 | Page number (1-indexed) |
| limit | 20 | 100 | Items per page |

### Cursor-based (for large datasets)
```
GET /api/v1/projects/:id/tasks?cursor=2025-01-15T10:00:00Z&limit=20
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| cursor | - | Opaque cursor from previous response |
| limit | 20 | Items per page |

**Cursor response**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "nextCursor": "2025-01-20T10:00:00Z",
    "hasMore": true,
    "limit": 20
  }
}
```

## Filtering

**Pattern**: Query parameters with exact match, array, or range syntax.

```
GET /api/v1/tasks?status=in_progress&priority=high,critical
GET /api/v1/tasks?dueDate[gte]=2025-01-01&dueDate[lte]=2025-01-31
GET /api/v1/tasks?assigneeId=uuid
```

| Operator | Description | Example |
|----------|-------------|---------|
| (exact) | Exact match | `status=in_progress` |
| , | OR match | `priority=high,critical` |
| [gte] | Greater than or equal | `dueDate[gte]=2025-01-01` |
| [lte] | Less than or equal | `dueDate[lte]=2025-01-31` |
| [gt] | Greater than | `createdAt[gt]=2025-01-01` |
| [lt] | Less than | `createdAt[lt]=2025-01-01` |
| [like] | Text search | `title[like]=stripe` |

## Sorting

```
GET /api/v1/tasks?sort=created_at&order=desc
GET /api/v1/tasks?sort=-priority,created_at
```

| Parameter | Default | Options |
|-----------|---------|---------|
| sort | created_at | Field name, prefix with - for descending |
| order | asc | asc, desc (used with single sort) |

**Multi-field sort**: `sort=-priority,created_at` sorts by priority descending, then created_at ascending.

## Response Envelope

All responses are wrapped in a standard envelope structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
  requestId?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  // OR for cursor-based:
  nextCursor?: string;
  hasMore?: boolean;
}
```

**Exception**: File download endpoints return raw binary streams, not JSON envelopes.

## Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | For auth routes | Bearer <access_token> |
| Content-Type | For POST/PATCH | application/json |
| X-Request-Id | Optional | Client-generated request ID for tracing |
| Accept-Language | Optional | Locale preference (future i18n) |

## Rate Limit Headers

Every response includes rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1704067200
```

## API Endpoints Summary

See individual module docs for complete endpoint details per resource.

| Prefix | Module | Auth Required |
|--------|--------|---------------|
| /api/v1/auth | Authentication | No (most endpoints) |
| /api/v1/workspaces | Workspace | Yes |
| /api/v1/projects | Project | Yes |
| /api/v1/tasks | Task | Yes |
| /api/v1/sprints | Sprint | Yes |
| /api/v1/board | Kanban | Yes |
| /api/v1/comments | Comment | Yes |
| /api/v1/attachments | Attachment | Yes |
| /api/v1/notifications | Notification | Yes |
| /api/v1/activity-logs | Activity Log | Yes |
| /api/v1/search | Search | Yes |
| /api/v1/analytics | Analytics | Yes |
| /api/v1/users | User profile | Yes |
| /api/v1/admin | Admin | Yes (Super Admin) |

## API Client Generation

Zod schemas can be shared between frontend and backend to generate type-safe API clients:

```typescript
// shared/types/api.ts
// Types generated from Zod schemas
export type CreateTaskDTO = z.infer<typeof createTaskSchema>;
export type TaskResponse = z.infer<typeof taskResponseSchema>;
export type ApiResponse<T> = { success: true; data: T } | { success: false; error: ApiError };
```

## Design Decisions

- **URL path versioning over header versioning** - Path versioning is explicit and testable. Header versioning (Accept: application/vnd.api+json;version=2) is invisible in logs and harder to debug.
- **PATCH over PUT** - PATCH for partial updates matches how frontend mutations work. Full PUT requires sending the entire resource, which leads to larger payloads and accidental overwrites.
- **Snake_case over camelCase** - While TypeScript uses camelCase, API responses use snake_case for consistency with database column names and broader API ecosystem. The frontend API client transforms responses to camelCase via Axios interceptor.
- **Error codes as strings** - Machine-readable error codes (`TASK_NOT_FOUND`) enable programmatic error handling on the frontend without parsing messages. Error codes are consistent across the application.
- **Request ID header** - Every response includes a request ID. This is critical for debugging production issues - users can provide the request ID and the team can trace the request through logs.
