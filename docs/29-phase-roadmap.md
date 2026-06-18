# Phase Roadmap

## Purpose
Define the complete implementation roadmap broken into 8 phases. Each phase includes goals, features, database changes, backend tasks, frontend tasks, and acceptance criteria.

## Phase 1: Project Setup, Authentication, RBAC

**Goal**: Initialize the project scaffold, implement authentication, and establish the RBAC permission system.

### Features
- Project initialization (monorepo structure, Docker, TypeScript config)
- PostgreSQL database setup with TypeORM
- Redis setup for caching and rate limiting
- User registration with email verification
- Login/logout with JWT (access + refresh tokens)
- Email verification flow
- Password reset flow
- RBAC permission system (roles, permissions, role_permissions)
- Super Admin seed user

### Database Changes
- Create users table
- Create roles table (seed: Super Admin)
- Create permissions table (seed: all permission codes)
- Create role_permissions table (seed: all mappings)
- Create migrations for uuid-ossp extension

### Backend Tasks
- [ ] Initialize Express project with TypeScript
- [ ] Configure TypeORM DataSource
- [ ] Set up Redis client
- [ ] Implement config module (env validation with Zod)
- [ ] Create shared kernel: AppError, logger (Pino), EventBus
- [ ] Implement error handling middleware
- [ ] Create auth module: controller, service, repository, routes
- [ ] Implement JWT token generation and verification
- [ ] Implement bcrypt password hashing
- [ ] Create auth middleware (JWT verification + Redis blacklist check)
- [ ] Create RBAC middleware (permission check)
- [ ] Build token utilities (generate, verify, blacklist, hash)
- [ ] Implement rate limiting middleware with Redis

### Frontend Tasks
- [ ] Initialize Next.js project with TypeScript + TailwindCSS
- [ ] Set up project structure (app router, providers, lib)
- [ ] Create UI primitives (button, input, card, modal, toast)
- [ ] Create auth provider (context + hooks)
- [ ] Implement API client with Axios (interceptors for auth)
- [ ] Build login page with form validation
- [ ] Build register page with form validation
- [ ] Build forgot password page
- [ ] Build verify email page
- [ ] Create layout components (auth layout, dashboard layout)

### Acceptance Criteria
- [ ] User can register with email/password
- [ ] User receives verification email (console log in dev)
- [ ] User can log in and receives JWT tokens
- [ ] User can refresh tokens automatically
- [ ] User can log out (token blacklisted)
- [ ] User can reset password
- [ ] Protected routes return 401 without valid token
- [ ] Permission check middleware returns 403 for unauthorized access
- [ ] Rate limiting works for auth endpoints
- [ ] All unit tests pass (>80% coverage)
- [ ] Docker compose builds and runs

## Phase 2: Workspace & Project Management

**Goal**: Implement workspace and project CRUD with member management.

### Features
- Workspace creation, listing, update, soft-delete
- Workspace member management (invite, role change, remove)
- Project creation within workspace
- Project member management
- Project settings (workflow columns, labels)
- Ownership transfer for workspaces

### Database Changes
- Create workspaces table
- Create workspace_members table
- Create projects table
- Create project_members table
- Create project_counters table
- Seed workspace-level roles (Owner, Admin, Project Manager, Member, Guest)
- Add workspace_id FK to relevant role entries

### Backend Tasks
- [ ] Create workspace module (controller, service, repository)
- [ ] Create project module (controller, service, repository)
- [ ] Implement member invitation flow
- [ ] Implement role assignment in workspace context
- [ ] Add workspace-level RBAC guards
- [ ] Add project-level RBAC guards
- [ ] Implement slug generation for workspaces
- [ ] Implement project key generation
- [ ] Build workspace settings endpoint

### Frontend Tasks
- [ ] Build workspace creation form
- [ ] Build workspace settings page
- [ ] Build workspace member management page
- [ ] Build project creation form
- [ ] Build project settings page
- [ ] Build project list view (grid/cards)
- [ ] Build workspace switcher dropdown
- [ ] Implement member invite dialog

### Acceptance Criteria
- [ ] User can create a workspace
- [ ] User can invite members by email
- [ ] Invited members appear in workspace member list
- [ ] User can change member roles
- [ ] Workspace owner can transfer ownership
- [ ] User can create projects within workspace
- [ ] User can add members to projects
- [ ] Project key is unique within workspace
- [ ] Workspace slug is URL-friendly and unique

## Phase 3: Task Management & Kanban Board

**Goal**: Implement the core task system with Kanban board view.

### Features
- Task CRUD with full lifecycle (backlog -> done)
- Task priorities and types
- Task assignments (multiple assignees)
- Parent-child task relationships
- Task dependencies
- Kanban board with drag-and-drop
- Fractional indexing for task ordering
- WIP limits

### Database Changes
- Create tasks table
- Create task_assignees table
- Create task_dependencies table
- Add indexes on tasks (project_id, status, position)

### Backend Tasks
- [ ] Create task module (controller, service, repository)
- [ ] Implement task CRUD operations
- [ ] Implement status transition validation
- [ ] Implement sequential ID generation per project
- [ ] Implement task assignment (add/remove assignees)
- [ ] Implement parent-child relationship logic
- [ ] Implement dependency graph with cycle detection
- [ ] Create kanban module
- [ ] Implement fractional indexing algorithm
- [ ] Implement WIP limit enforcement
- [ ] Create batch position update endpoint

### Frontend Tasks
- [ ] Build task creation form with all fields
- [ ] Build task detail view
- [ ] Build task edit form
- [ ] Build Kanban board with @dnd-kit
- [ ] Implement drag-and-drop within and across columns
- [ ] Implement optimistic Kanban updates
- [ ] Build backlog view (table or list)
- [ ] Implement inline task creation on board
- [ ] Build task filtering in backlog view
- [ ] Show task card with priority, assignees, due date

### Acceptance Criteria
- [ ] User can create/edit/delete tasks
- [ ] User can change task status
- [ ] Invalid status transitions return 422
- [ ] User can assign multiple users to a task
- [ ] User can create subtasks
- [ ] Circular dependencies are detected and rejected
- [ ] Board loads tasks grouped by column
- [ ] Drag-and-drop updates task position
- [ ] Fractional indexing prevents position conflicts
- [ ] WIP limits prevent exceeding column capacity
- [ ] All task mutation operations emit activity log entries

## Phase 4: Comments, Attachments & Notifications

**Goal**: Add collaboration features with comments, file attachments, and notification system.

### Features
- Threaded comments on tasks
- @mention detection and autocomplete
- File upload and download
- In-app notification system
- Notification preferences
- Image thumbnail generation

### Database Changes
- Create comments table
- Create attachments table
- Create notifications table
- Add indexes for comment lookup by task

### Backend Tasks
- [ ] Create comment module
- [ ] Implement threaded replies
- [ ] Implement @mention parsing and validation
- [ ] Create attachment module
- [ ] Implement StorageProvider (local + S3)
- [ ] Implement file upload with validation
- [ ] Implement download with access control
- [ ] Implement thumbnail generation (sharp)
- [ ] Create notification module
- [ ] Implement notification creation from events
- [ ] Implement read/unread operations
- [ ] Implement notification preferences

### Frontend Tasks
- [ ] Build comment thread component
- [ ] Build comment editor with @mention autocomplete
- [ ] Build file upload component (drag-and-drop)
- [ ] Build file attachment list in task detail
- [ ] Build notification dropdown in header
- [ ] Build notification settings page
- [ ] Implement realtime notification display
- [ ] Show unread notification badge

### Acceptance Criteria
- [ ] User can add comments to tasks
- [ ] User can reply to comments (threaded)
- [ ] @mention triggers autocomplete
- [ ] Mentioned user receives notification
- [ ] User can upload files (10MB limit)
- [ ] File downloads enforce access control
- [ ] Image thumbnails generate on upload
- [ ] Notifications appear in dropdown
- [ ] User can mark notifications as read
- [ ] User can configure notification preferences

## Phase 5: Realtime Collaboration

**Goal**: Implement Socket.IO-based realtime collaboration features.

### Features
- Real-time task updates across clients
- Presence indicators (online/offline)
- Typing indicators on comments
- Real-time notification delivery
- Redis Socket.IO adapter for scaling

### Backend Tasks
- [ ] Set up Socket.IO server with Express
- [ ] Implement Socket.IO auth middleware (JWT)
- [ ] Set up Redis adapter for Socket.IO
- [ ] Implement room management (workspace, project, task)
- [ ] Implement presence tracking (Redis SET with TTL)
- [ ] Implement typing indicator events
- [ ] Emit realtime events from task/comment controllers
- [ ] Implement rate limiting for Socket.IO events

### Frontend Tasks
- [ ] Create Socket.IO client singleton
- [ ] Create socket provider (connect/disconnect with auth)
- [ ] Implement automatic room joining (workspace, project)
- [ ] Show online/offline indicators on avatars
- [ ] Build typing indicator display in comments
- [ ] Implement realtime task cache updates
- [ ] Handle reconnection gracefully

### Acceptance Criteria
- [ ] Task updates appear in real-time on other clients
- [ ] User sees online/offline status of workspace members
- [ ] Typing indicator appears when another user types a comment
- [ ] Notifications arrive in real-time without page refresh
- [ ] Connection drops and reconnects gracefully (no duplicate events)
- [ ] Multiple server instances sync via Redis adapter

## Phase 6: Redis & BullMQ Jobs

**Goal**: Add Redis caching, rate limiting, and async job processing with BullMQ.

### Features
- Redis caching layer for frequent reads
- Rate limiting with sliding window
- Auth token blacklisting
- BullMQ queues (email, notification, activity, analytics)
- Scheduled jobs (cleanup, archiving)
- Job retry and dead-letter handling

### Backend Tasks
- [ ] Implement CacheService (get/set/invalidate)
- [ ] Add caching to frequent queries (permissions, dashboard)
- [ ] Implement cache invalidation on mutations
- [ ] Set up BullMQ queues with Redis connection
- [ ] Create email worker (nodemailer/SendGrid)
- [ ] Create notification worker
- [ ] Create activity processing worker
- [ ] Create analytics worker (velocity, workload)
- [ ] Create cleanup queue for scheduled jobs
- [ ] Implement job retry strategies per queue
- [ ] Implement dead-letter monitoring
- [ ] Set up recurring scheduled jobs
- [ ] Add BullMQ Board for admin monitoring

### Frontend Tasks
- [ ] No direct frontend changes (caching is transparent)
- [ ] Display email sent status in UI (optional)

### Acceptance Criteria
- [ ] Dashboard metrics load < 200ms with caching
- [ ] Permission checks cached and invalidated on role change
- [ ] Rate limiting blocks excessive requests (429)
- [ ] Email jobs process asynchronously (API responds before email sent)
- [ ] Failed email jobs retry with backoff
- [ ] Scheduled cleanup jobs run daily
- [ ] BullMQ Board accessible to Super Admin
- [ ] Cache invalidates on data mutation

## Phase 7: Dashboard Analytics

**Goal**: Build analytical dashboards for workspaces and projects.

### Features
- Workspace dashboard with aggregate metrics
- Project dashboard with task distributions
- Sprint burndown chart
- Velocity tracking
- Workload distribution
- Full-text search across tasks

### Database Changes
- Add GIN index for full-text search on tasks (title + description)
- Add tsvector generated column for tasks

### Backend Tasks
- [ ] Create analytics module
- [ ] Implement workspace dashboard aggregation queries
- [ ] Implement project dashboard aggregation queries
- [ ] Implement sprint burndown calculation
- [ ] Implement velocity tracking (per sprint, rolling average)
- [ ] Implement workload distribution query
- [ ] Add caching layer for dashboard metrics
- [ ] Create search module with PostgreSQL full-text search
- [ ] Implement search with filtering, sorting, pagination
- [ ] Add search scope enforcement (workspace/project)

### Frontend Tasks
- [ ] Build workspace dashboard page
- [ ] Build project dashboard page
- [ ] Build burndown chart component (Recharts)
- [ ] Build velocity trend chart
- [ ] Build workload distribution table
- [ ] Build global search bar in header
- [ ] Build search results page with filters
- [ ] Implement search-as-you-type with debounce

### Acceptance Criteria
- [ ] Dashboard shows task counts by status
- [ ] Burndown chart shows expected vs actual progress
- [ ] Velocity chart shows trend across sprints
- [ ] Workload view shows task distribution per member
- [ ] Search returns relevant results sorted by rank
- [ ] Search filters work (status, priority, assignee)
- [ ] Search respects access control (only tasks user can see)
- [ ] Dashboard metrics are cached (< 200ms load time)

## Phase 8: DevOps, CI/CD, Production Polish

**Goal**: Production-ready deployment with CI/CD pipeline, monitoring, and security hardening.

### Features
- GitHub Actions CI/CD pipeline
- Docker Compose production configuration
- Nginx reverse proxy with SSL
- Load testing and performance tuning
- Security hardening
- Monitoring and alerting
- Production documentation

### Infrastructure Tasks
- [ ] Finalize Docker Compose for production
- [ ] Configure Nginx with SSL (Let's Encrypt)
- [ ] Set up GitHub Actions CI workflow
- [ ] Set up GitHub Actions CD workflow (staging)
- [ ] Set up GitHub Actions CD workflow (production)
- [ ] Configure Docker health checks
- [ ] Set up database backup automation
- [ ] Configure monitoring (health endpoints, logging)
- [ ] Performance test with k6/artillery
- [ ] Security audit (OWASP Top 10 verification)

### Backend Tasks
- [ ] Add health check endpoints
- [ ] Add structured logging with request correlation IDs
- [ ] Add Prometheus metrics endpoint (future)
- [ ] Implement graceful shutdown handling
- [ ] Add database migration automation in deploy
- [ ] Finalize CORS configuration for production
- [ ] Load test and optimize slow queries

### Frontend Tasks
- [ ] Add loading skeletons for all pages
- [ ] Implement error boundaries for all page sections
- [ ] Add page-level metadata (title, description)
- [ ] Performance audit (Lighthouse)
- [ ] Accessibility audit (a11y)
- [ ] Add service worker for offline (future)
- [ ] Responsive design review

### Acceptance Criteria
- [ ] CI pipeline runs on every PR
- [ ] Staging auto-deploys on develop merge
- [ ] Production deploys on manual approval
- [ ] All services health-check pass
- [ ] SSL certificate auto-renews
- [ ] Database backups run daily
- [ ] API responds < 500ms p95 under load
- [ ] Frontend Lighthouse score > 90
- [ ] All OWASP Top 10 mitigations verified
- [ ] Deployment rollback procedure documented
