# System Architecture

## Purpose
Define the system-level architectural decisions, module boundaries, data flow, and deployment topology that form the backbone of the platform.

## Monolith vs Microservice Decision

**Decision: Modular Monolith**

The system starts as a modular monolith. This is a deliberate trade-off:

| Factor | Monolith | Microservices | Verdict |
|--------|----------|---------------|---------|
| Team size | 1-5 engineers | Requires 3+ teams | Monolith |
| Deployment complexity | One Docker image | Multi-service orchestration | Monolith |
| Development velocity | Fast iteration | Coordinated releases | Monolith |
| Module boundaries | Enforced by code | Enforced by network | Microservices |
| Scalability | Vertical then split | Horizontal from day one | Microservices |
| Startup time | Seconds | Minutes | Monolith |

**Extraction path**: Each module is a self-contained NestJS-style module with its own controller, service, repository, DTOs, and events. When extraction is needed, copy the module folder into a new service, add an API gateway, and wire event publishing over Redis. No rewrites required.

## Architectural Style

**Layered Architecture with Domain Modules**

```
┌─────────────────────────────────────────────────┐
│                   API Gateway                    │
│         Shared Middleware (Auth, RBAC, Rate)      │
├─────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │  Auth    │ │Workspace │ │ Project  │  ...    │
│  │  Module  │ │ Module   │ │ Module   │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│         │            │            │             │
│  ┌────────────────────────────────────────┐     │
│  │         Shared Kernel                  │     │
│  │  (Common utils, guards, decorators,    │     │
│  │   DTOs, entities, event bus)          │     │
│  └────────────────────────────────────────┘     │
├─────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │PostgreSQL│ │  Redis   │ │   S3     │        │
│  └──────────┘ └──────────┘ └──────────┘        │
└─────────────────────────────────────────────────┘
```

## Folder Structure

```
pm-platform/
├── docker/                    # Docker configs
│   ├── nginx/
│   ├── postgres/
│   └── redis/
├── backend/
│   ├── src/
│   │   ├── index.ts           # Entry point
│   │   ├── app.ts             # Express app setup
│   │   ├── config/            # env validation, config objects
│   │   ├── shared/            # shared kernel
│   │   │   ├── middleware/    # auth, rbac, validation, error
│   │   │   ├── guards/        # decorator-based guards
│   │   │   ├── dto/           # shared DTOs
│   │   │   ├── errors/        # AppError classes
│   │   │   ├── logger/        # structured logger
│   │   │   └── types/         # global TypeScript types
│   │   ├── modules/           # domain modules
│   │   │   ├── auth/
│   │   │   ├── workspace/
│   │   │   ├── project/
│   │   │   ├── task/
│   │   │   ├── kanban/
│   │   │   ├── sprint/
│   │   │   ├── comment/
│   │   │   ├── attachment/
│   │   │   ├── notification/
│   │   │   ├── activity-log/
│   │   │   ├── search/
│   │   │   └── analytics/
│   │   ├── jobs/              # BullMQ job definitions
│   │   └── realtime/          # Socket.IO setup
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   ├── components/        # shared UI components
│   │   ├── modules/           # feature modules
│   │   ├── lib/               # utilities, API client
│   │   └── providers/         # React context providers
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
├── .env.example
└── CLAUDE.md
```

## Module Boundaries

Each module at `backend/src/modules/<name>/` follows this structure:

```
<name>/
├── <name>.controller.ts    # Route handlers
├── <name>.service.ts       # Business logic
├── <name>.repository.ts    # TypeORM data access
├── <name>.entity.ts        # TypeORM entity
├── <name>.dto.ts           # Zod validation schemas
├── <name>.routes.ts        # Route definitions
├── <name>.module.ts        # Module registration
├── <name>.events.ts        # Domain event definitions
└── __tests__/              # Module-specific tests
```

**Dependency Rules**:

1. Modules may depend on Shared Kernel only — never on another module's service directly
2. Cross-module communication uses domain events via EventBus
3. Controllers call Services. Services call Repositories. Repositories query the database
4. No business logic in controllers or repositories
5. DTOs validate at the controller boundary — invalid data never reaches the service layer

## Request Flow

```
Client → Nginx → Express → Middleware Stack → Router → Controller → Service → Repository → DB
                              │
                        1. RequestLogger
                        2. RateLimiter (Redis)
                        3. AuthGuard (JWT verify)
                        4. RBACGuard (role check)
                        5. Validation (Zod DTO)
                        6. Transaction (optional)
```

**Response flow** (reverse):
```
Repository → Service → Controller → ResponseFormatter → Client
                              │
                          Emit events:
                          - ActivityLogEvent
                          - NotificationEvent (via EventBus → BullMQ)
                          - RealtimeEvent (via Socket.IO)
```

## Event Flow

```
Controller/Service
    │
    ▼
EventBus.emit(event)
    │
    ├──> Synchronous handlers (within same request scope)
    │     - ActivityLogHandler (writes to activity_logs table)
    │
    └──> BullMQ Queue (async, via Redis)
          - EmailQueue → EmailWorker
          - NotificationQueue → NotificationWorker
          - AnalyticsQueue → AnalyticsWorker
```

## Realtime Flow

```
Client A (Socket.IO)
    │  Emit: "task:update" { taskId, status }
    ▼
Socket.IO Server
    │  Validate JWT, verify RBAC
    │  Broadcast: "task:updated" via Redis adapter
    ▼
Client B (Socket.IO) ← "task:updated" event
    │  TanStack Query cache invalidation
    ▼
    UI re-renders with optimistic update
```

**Room structure**:
- `workspace:<id>` — all members of a workspace
- `project:<id>` — all members of a project
- `task:<id>` — users assigned to or watching a task
- `user:<id>` — personal notification channel

## Design Decisions

- **Express over Fastify** — Larger ecosystem for middleware, simpler integration with Socket.IO, more familiar to the target team.
- **Redis adapter for Socket.IO** — Required for horizontal scaling. Without it, Socket.IO messages are lost when multiple backend instances run.
- **Domain events over direct calls** — Prevents circular dependencies between modules and makes cross-module communication auditable.
- **EventBus as shared kernel** — A lightweight in-process pub/sub with automatic forwarding to BullMQ for async handlers. Synchronous handlers run in the same transaction.

## Future Considerations

- **API Gateway extraction** — When splitting modules into services, a gateway (Express Gateway or Kong) handles routing, auth, and rate limiting centrally.
- **gRPC for inter-service** — If microservices are extracted, use gRPC for synchronous inter-service calls with protobuf serialization.
- **CQRS read models** — For the analytics module specifically, a materialized view pattern (CQRS-lite) can be introduced without changing the monolith structure.
