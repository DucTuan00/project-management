# Frontend Architecture

## Purpose
Define the Next.js frontend architecture, component hierarchy, state management strategy, and routing conventions for the project management platform.

## Framework Strategy

**Decision**: Next.js 14+ App Router with hybrid rendering

- **Server Components** — Default for pages, data fetching, static content. Reduces client JS bundle.
- **Client Components** — Only where interactivity is required: forms, drag-and-drop, realtime updates, modals.
- **API Client** — Server-side fetch for initial page data, TanStack Query on client for mutations and refetching.

## Directory Structure

```
frontend/src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── verify-email/
│   ├── (dashboard)/              # Authenticated routes
│   │   ├── (sidebar)/            # Layout with sidebar
│   │   │   ├── dashboard/
│   │   │   ├── workspace/[id]/
│   │   │   │   ├── settings/
│   │   │   │   ├── projects/
│   │   │   │   └── members/
│   │   │   └── project/[id]/
│   │   │       ├── board/
│   │   │       ├── backlog/
│   │   │       ├── sprint/
│   │   │       ├── task/[taskId]/
│   │   │       └── settings/
│   │   └── layout.tsx
│   ├── layout.tsx                # Root layout
│   └── providers.tsx             # Client provider wrapper
├── components/                   # Shared UI components
│   ├── ui/                       # Primitive components (button, input, modal)
│   ├── layout/                   # Sidebar, header, page shells
│   └── shared/                   # Avatars, loading states, empty states
├── modules/                      # Feature modules
│   ├── auth/
│   │   ├── components/           # LoginForm, RegisterForm
│   │   └── schemas/              # Zod schemas for auth forms
│   ├── workspace/
│   ├── project/
│   ├── task/
│   ├── kanban/
│   ├── sprint/
│   ├── comment/
│   ├── notification/
│   ├── search/
│   └── analytics/
├── lib/                          # Utilities
│   ├── api-client.ts             # Axios/fetch wrapper with auth interceptor
│   ├── socket-client.ts          # Socket.IO client singleton
│   ├── query-client.ts           # TanStack Query client config
│   ├── utils.ts                  # cn(), date formatters, etc.
│   └── constants.ts              # API base URL, routes, enums
└── providers/                    # React context providers
    ├── auth-provider.tsx
    ├── socket-provider.tsx
    └── theme-provider.tsx
```

## Component Hierarchy

```
RootLayout
├── Providers (QueryClient, Auth, Socket, Theme)
│   ├── AuthLayout (redirect to /login if unauthenticated)
│   │   ├── SidebarLayout
│   │   │   ├── Sidebar (workspace switcher, nav links)
│   │   │   ├── Header (breadcrumb, search, notifications, avatar)
│   │   │   └── PageContent (slot for route page)
│   │   └── AuthPage (for login/register)
```

## State Management

**Decision**: TanStack Query for server state, React context for client state, no global store.

| State Type | Tool | Why |
|------------|------|-----|
| Server data (tasks, projects, etc.) | TanStack Query | Auto-caching, refetching, optimistic updates, stale-while-revalidate |
| Auth state (current user, token) | React Context | Read-heavy, write-light, needed in layout |
| Socket connection | React Context | Singleton connection, shared across components |
| Form state | React Hook Form | Per-form, ephemeral, no global state needed |
| Drag-and-drop | @dnd-kit (local state) | Component-local, transient during drag |

### Query Key Convention

```typescript
// Hierarchical keys for cache invalidation
['workspaces']
['workspace', workspaceId]
['workspace', workspaceId, 'projects']
['workspace', workspaceId, 'members']
['project', projectId]
['project', projectId, 'tasks']
['project', projectId, 'tasks', taskId]
['project', projectId, 'board']
['project', projectId, 'sprints']
['project', projectId, 'sprints', sprintId]
['task', taskId, 'comments']
['task', taskId, 'activity-log']
['notifications', userId]
['analytics', projectId, 'burndown']
```

**Invalidation rule**: Mutate at a specific key, invalidate its parent. Example: updating a task invalidates `['project', projectId, 'tasks']` which refetches all tasks for that project.

## Routing Design

| Route | Page Component | Access |
|-------|---------------|--------|
| `/login` | LoginPage | Public |
| `/register` | RegisterPage | Public |
| `/verify-email?token=` | VerifyEmailPage | Public |
| `/forgot-password` | ForgotPasswordPage | Public |
| `/dashboard` | DashboardPage | Auth |
| `/workspace/:id` | WorkspacePage | Auth + WorkspaceMember |
| `/workspace/:id/settings` | WorkspaceSettingsPage | Auth + WorkspaceAdmin |
| `/workspace/:id/members` | WorkspaceMembersPage | Auth + WorkspaceAdmin |
| `/project/:id` | ProjectPage | Auth + ProjectMember |
| `/project/:id/board` | KanbanBoardPage | Auth + ProjectMember |
| `/project/:id/backlog` | BacklogPage | Auth + ProjectMember |
| `/project/:id/sprint/:sprintId` | SprintPage | Auth + ProjectMember |
| `/project/:id/task/:taskId` | TaskDetailPage | Auth + ProjectMember |
| `/project/:id/settings` | ProjectSettingsPage | Auth + ProjectAdmin |

## Design Decisions

- **No global state library** — TanStack Query + Context covers all cases. Redux/Zustand adds complexity without benefit for this domain.
- **Server Components for initial data** — Fetch workspace/project data server-side, pass as initial query data to TanStack Query on client. Improves perceived performance.
- **@dnd-kit over react-beautiful-dnd** — @dnd-kit is maintained, supports multiple containers (Kanban columns), and has better TypeScript support. react-beautiful-dnd is deprecated.
- **Next.js App Router over Pages Router** — Server Components, streaming, and nested layouts reduce client JS and improve SEO for public pages.

## Best Practices

1. **Server Components by default** — Only add `"use client"` when interactivity requires it.
2. **Colocate query hooks** — Each module folder contains its own TanStack Query hooks file (e.g., `modules/task/queries.ts`).
3. **Optimistic updates** — Use TanStack Query's `onMutate` for all drag-and-drop and status changes. Roll back on error.
4. **Error boundaries** — Wrap each page section in an error boundary. Never show a blank page.
5. **Lazy load modals** — Use Next.js dynamic imports for modal components to keep initial bundle small.

## Future Considerations

- **Micro-frontend extraction** — If the app grows beyond a single team, each module can be extracted into its own Next.js app (module federation or iframe).
- **PWA** — Add service worker for offline support and push notifications.
- **Storybook** — Component library documentation for shared UI components.
