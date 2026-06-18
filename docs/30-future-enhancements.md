# Future Enhancements

## Purpose
Catalog planned enhancements beyond the MVP scope. These are organized by priority and readiness for implementation.

## Tier 1: Near-term (Post-MVP, 1-3 months)

### Microservices Extraction

**Motivation**: As team grows and traffic increases, extract high-traffic modules into independent services.

**Candidates for first extraction**:
1. **Notification Service** - Handles notification creation, delivery, and email sending. Has independent scaling characteristics (bursty, CPU-bound for template rendering).
2. **Search Service** - Dedicated search service with Meilisearch/Elasticsearch. Offloads full-text search from PostgreSQL.

**Migration strategy**:
1. Copy module code into new service repository
2. Add gRPC/REST interface for inter-service communication
3. Replace EventBus subscription with message queue consumer
4. Route traffic through API Gateway

**Estimated effort**: 2-4 weeks per module

### OAuth / SSO Integration

**Providers**: Google, GitHub, Microsoft (Azure AD), SAML 2.0

**Implementation**:
- Passport.js strategies for each provider
- Automatic account linking (if email matches existing user)
- First-time OAuth login creates account
- Enterprise workspaces can enforce SSO-only login

**Estimated effort**: 1-2 weeks

### Webhook System

**Purpose**: Allow external integrations to subscribe to platform events.

**Events**: task.created, task.updated, comment.created, sprint.completed

**Implementation**:
- Webhook registration per workspace/project
- Secret signing for payload verification
- Retry with exponential backoff
- Delivery logs with status history
- Rate limiting (500 webhooks/hour per workspace)

**Estimated effort**: 1-2 weeks

### Custom Fields

**Purpose**: Allow workspaces to define custom fields on tasks beyond the built-in fields.

**Types**: Text, Number, Date, Dropdown, Checkbox, URL, User

**Implementation**:
- Custom field definitions stored in project settings JSONB
- Values stored in tasks.metadata JSONB
- Field definitions validated by Zod per type
- Custom fields appear in task creation/editing forms
- Custom fields are searchable (future)

**Estimated effort**: 2-3 weeks

## Tier 2: Medium-term (3-6 months)

### Reporting and Advanced Analytics

**Features**:
- Custom report builder (select metrics, date range, grouping)
- CSV/PDF export for all reports
- Cumulative flow diagram
- Cycle time / lead time analysis
- Sprint predictability metrics
- Team velocity forecasting
- Scheduled report delivery via email

**Implementation**:
- CQRS pattern: dedicated read models for analytics
- Materialized views refreshed by BullMQ jobs
- Report templates stored in database

**Estimated effort**: 3-4 weeks

### Time Tracking

**Features**:
- Start/stop timer on tasks
- Manual time entry (logged against tasks)
- Time estimates vs actuals comparison
- Weekly timesheet view
- Time reports per user/project/workspace

**Implementation**:
- Time entries table (task_id, user_id, start_time, end_time, description)
- Timer state in Redis (active timer per user)
- Daily total aggregation

**Estimated effort**: 2-3 weeks

### Advanced Permissions (ABAC)

**Features**:
- Attribute-based rules: "Project leads can move tasks to Done regardless of WIP limits"
- Custom permission policies per workspace
- Time-based permissions (temporary access grants)
- Permission audit trail

**Implementation**:
- Policy engine with condition evaluation
- Conditions reference user attributes, resource attributes, and context
- Policies stored as JSON in database
- Evaluated at request time alongside RBAC

**Estimated effort**: 3-4 weeks

### Mobile App

**Approach**: React Native or PWA

**Features**:
- Task viewing and status updates
- Push notifications
- Comment creation
- File uploads (camera/gallery)
- Kanban board view (read-only)

**Implementation**:
- Share API client library with web frontend
- Separate auth flow (longer-lived refresh tokens for mobile)
- Offline queue for mutations when disconnected

**Estimated effort**: 8-12 weeks for initial release

## Tier 3: Long-term (6-12 months)

### Plugin / Marketplace

**Concept**: Third-party developers can build plugins that extend platform functionality.

**Plugin types**:
- Custom field types
- Board customization (swimlanes, card layouts)
- Integration connectors (Slack, Teams, Jira, GitLab)
- Workflow automations
- Report templates

**Infrastructure**:
- Plugin API (sandboxed)
- Plugin registry and version management
- Plugin permissions (scoped access grants)
- Pricing and billing integration

**Estimated effort**: 8-12 weeks

### Automation Engine

**Concept**: IFTTT-style automation rules: "When task moves to Done, notify the reporter and move parent task to Review."

**Rule components**:
- Trigger: task.created, task.status_changed, comment.added, etc.
- Conditions: field value checks, role checks, time-based
- Actions: update field, assign user, add comment, send webhook

**Implementation**:
- Rule definitions stored as JSON
- Rule evaluation via BullMQ (async, queued)
- Dry-run mode for testing rules
- Execution logs for debugging

**Estimated effort**: 4-6 weeks

### Multi-Region Deployment

**Purpose**: Reduce latency for globally distributed teams.

**Components**:
- PostgreSQL read replicas per region
- Redis replication (active-passive)
- S3/CloudFront for file storage
- Geo-routing via Cloudflare or Route53
- Cross-region data sync for writes

**Estimated effort**: 4-8 weeks

### GraphQL API

**Purpose**: Enable clients to request exactly the data they need, reducing over-fetching and number of requests.

**Approach**: Apollo Server alongside Express REST API (not replacing it).

**Implementation**:
- Schema-first GraphQL with type definitions
- Resolvers that delegate to existing services
- DataLoader for batching and caching
- GraphQL subscriptions for realtime (replacing Socket.IO for some use cases)
- Rate limiting and complexity limits on queries

**Estimated effort**: 4-6 weeks

## Technical Debt & Maintainability

### E2E Test Expansion

- Full user flow tests (registration -> create workspace -> create project -> create task -> move on board -> add comment)
- Cross-browser testing (Chrome, Firefox, Safari)
- Visual regression testing (Playwright screenshot comparison)
- Accessibility testing (axe-core integration)

### Documentation

- API reference (OpenAPI/Swagger from Zod schemas)
- Developer onboarding guide
- Deployment runbook
- Incident response playbook

### Performance Optimization

- Database query optimization (slow query log analysis)
- Frontend bundle analysis (webpack-bundle-analyzer)
- Image CDN integration
- Server-side rendering optimization
- Redis cache hit ratio optimization (>90% target)
- Database connection pooling (PgBouncer)

## Keeping Architecture Clean

### Refactoring Triggers

| Trigger | Action |
|---------|--------|
| Module exceeds 5000 lines | Extract submodules |
| Service exceeds 500 lines | Extract helper classes |
| Repository has 10+ custom queries | Consider QueryBuilder pattern |
| EventBus has 50+ subscriptions | Consider domain event namespace |
| Test suite takes > 5 min | Parallelize, split CI jobs |

### Architecture Decision Records

For every significant architecture change, create an ADR in .claude/adr/:
- Date
- Context
- Decision
- Consequences
- Status (proposed, accepted, deprecated)

## Design Decisions for Future Phases

- **Extraction over rewrite** - Each module is designed as a self-contained unit with clear interfaces. Extraction to microservice is copy-paste-refactor, not a rewrite.
- **Progressive enhancement** - Features like ABAC enhance, not replace, the RBAC system. Custom fields enhance, not replace, built-in fields.
- **Backward compatibility** - API versioning ensures existing integrations continue working. Deprecation headers warn of upcoming changes.
- **Facade over leaky abstraction** - The GraphQL API is a facade over the REST layer, not a separate data access path. This prevents logic duplication.
- **PostgreSQL first** - Before adding a new database technology (Elasticsearch, etc.), prove that PostgreSQL's capabilities are genuinely insufficient at expected scale.
