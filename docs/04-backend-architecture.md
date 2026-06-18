# Backend Architecture

## Purpose
Define the Express.js backend structure, middleware chain, error handling strategy, module lifecycle, and dependency injection approach.

## Application Structure

```
src/
├── index.ts                    # Bootstrap: load config, connect DB/Redis, start server
├── app.ts                      # Express app factory: middleware → routes → error handler
├── config/
│   ├── env.ts                  # Zod-validated environment variables
│   ├── database.ts             # TypeORM DataSource configuration
│   ├── redis.ts                # Redis client setup
│   └── bull.ts                 # BullMQ connection config
├── shared/
│   ├── middleware/
│   │   ├── auth.middleware.ts   # JWT verification
│   │   ├── rbac.middleware.ts   # Role/permission check
│   │   ├── validate.middleware.ts # Zod schema validation
│   │   ├── rate-limit.middleware.ts # Redis-based rate limiting
│   │   ├── transaction.middleware.ts # TypeORM transaction wrapper
│   │   └── error.middleware.ts  # Global error handler
│   ├── guards/
│   │   ├── workspace-guard.ts  # Verifies user is workspace member
│   │   └── project-guard.ts    # Verifies user is project member
│   ├── dto/
│   │   ├── pagination.dto.ts   # Shared pagination schema
│   │   └── response.dto.ts     # Standard response shape
│   ├── errors/
│   │   ├── app-error.ts        # Base AppError class
│   │   ├── not-found.ts
│   │   ├── unauthorized.ts
│   │   ├── forbidden.ts
│   │   └── validation-error.ts
│   ├── logger/
│   │   └── logger.ts           # Winston/Pino structured logger
│   ├── event-bus/
│   │   └── event-bus.ts        # In-process pub/sub with BullMQ forwarding
│   └── utils/
│       ├── pagination.ts       # Pagination helper
│       └── slug.ts             # Slug generation
├── modules/
│   ├── auth/
│   ├── workspace/
│   ├── project/
│   ├── task/
│   ├── kanban/
│   ├── sprint/
│   ├── comment/
│   ├── attachment/
│   ├── notification/
│   ├── activity-log/
│   ├── search/
│   └── analytics/
├── jobs/
│   ├── queues.ts               # Queue definitions
│   ├── email.worker.ts
│   ├── notification.worker.ts
│   ├── activity.worker.ts
│   └── analytics.worker.ts
└── realtime/
    ├── index.ts                # Socket.IO server setup
    ├── auth.ts                 # Socket.IO auth middleware
    └── handlers/               # Per-event handlers
```

## Express App Factory (`app.ts`)

```typescript
// Pseudocode — structure only
export function createApp(): Express {
  const app = express();

  // 1. Global middleware (order matters)
  app.use(cors(corsConfig));
  app.use(helmet());
  app.use(express.json({ limit: '10mb' }));
  app.use(requestLogger);

  // 2. Rate limiter (applies to /api/*)
  app.use('/api', rateLimiter);

  // 3. Health check (no auth)
  app.get('/health', healthCheck);

  // 4. Module routes (auth first, others need auth)
  app.use('/api/v1/auth', authRoutes);

  // All routes below require JWT
  app.use('/api/v1', authMiddleware);

  app.use('/api/v1/workspaces', workspaceRoutes);
  app.use('/api/v1/projects', projectRoutes);
  app.use('/api/v1/tasks', taskRoutes);
  app.use('/api/v1/board', kanbanRoutes);
  app.use('/api/v1/sprints', sprintRoutes);
  app.use('/api/v1/comments', commentRoutes);
  app.use('/api/v1/attachments', attachmentRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/activity-logs', activityLogRoutes);
  app.use('/api/v1/search', searchRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);

  // 5. Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
```

## Middleware Chain

Each request passes through:

1. **CORS + Helmet** — Security headers, cross-origin policy
2. **Request Logger** — Structured log with request ID, method, path, duration
3. **Rate Limiter** — Sliding window via Redis, per-IP for auth, per-user for API
4. **Auth Middleware** — Extracts and verifies JWT from `Authorization: Bearer <token>`
5. **Route-specific middleware** — RBAC guard, workspace guard, validation
6. **Controller** — Extracts validated data from `req.body`/`req.params`/`req.query`, calls service
7. **Service** — Business logic, calls repositories, emits events
8. **Repository** — TypeORM query execution

## Error Handling Strategy

**All errors are instances of `AppError`**:

```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,     // HTTP status
    public code: string,           // Machine-readable: 'WORKSPACE_NOT_FOUND'
    message: string,               // Human-readable
    public details?: unknown       // Validation errors, etc.
  ) { super(message); }
}

// Predefined subclasses:
// - NotFoundError (404)
// - UnauthorizedError (401)
// - ForbiddenError (403)
// - ValidationError (400)
// - ConflictError (409)
// - TooManyRequestsError (429)
```

**Global error handler**:
```typescript
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details }
    });
  }
  // Unexpected errors — log and return 500
  logger.error({ err, requestId: req.id }, 'Unhandled error');
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
  });
}
```

## Module Lifecycle

Each module exports a `registerModule()` function that receives the Express app and registers its routes:

```typescript
// In <name>.module.ts
export function registerModule(app: Express, container: Container) {
  const controller = new Controller(container.service);
  app.use('/api/v1/resources', controller.router);
}
```

All modules are registered in `app.ts` explicitly, maintaining clear dependency ordering.

## Event Bus Architecture

```typescript
// shared/event-bus/event-bus.ts
interface DomainEvent {
  name: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  metadata: { userId: string; timestamp: Date; correlationId: string };
}

class EventBus {
  private handlers: Map<string, Array<(event: DomainEvent) => Promise<void>>>;

  subscribe(eventName: string, handler: (event: DomainEvent) => Promise<void>): void;
  publish(event: DomainEvent): Promise<void>;  // runs sync handlers, forwards async to BullMQ
}
```

Synchronous handlers (activity log) run immediately. Async handlers (email, push notification) are forwarded to BullMQ queues.

## Design Decisions

- **Manual DI over NestJS** — Avoids NestJS's heavy abstraction and tightly-coupled module system. A simple `Container` class manages service singletons with constructor injection.
- **Zod over class-validator** — Zod works with plain objects, has better TypeScript inference, and is faster at runtime. No decorator noise on entities.
- **Pino over Winston** — Faster JSON logging, better for production. Winston used only if human-readable console output is needed in development.
- **Explicit route registration** — No auto-discovery of routes. Explicit registration in `app.ts` makes request flow obvious.

## Best Practices

1. **Never trust `req.params` or `req.body`** — Always validate with Zod schemas.
2. **Services return data, never Response objects** — Controllers handle HTTP concerns.
3. **Transactional boundaries** — Use `QueryRunner` for operations that touch multiple entities. Rollback on any failure.
4. **Correlation IDs** — Every request gets a UUID. Pass it to logs, events, and error responses.
5. **Clean shutdown** — Gracefully close DB connections, Redis, BullMQ workers, and Socket.IO on SIGTERM.

## Future Considerations

- **OpenAPI generation** — Zod schemas can generate OpenAPI specs via `zod-to-openapi`, enabling Swagger UI without maintenance burden.
- **Feature flags** — A simple in-Redis feature flag system for gradual rollout of new module functionality.
