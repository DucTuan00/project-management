# Dashboard Analytics

## Purpose
Define the analytics and dashboard module including key metrics, chart data generation, caching strategy, and realtime metric updates.

## Responsibilities

- Generate dashboard metrics for workspaces and projects
- Provide burndown chart data for active sprints
- Calculate velocity trends across sprints
- Compute workload distribution across team members
- Cache aggregated metrics for fast loading
- Support date-range-based filtering

## Dashboard Types

### Workspace Dashboard
High-level overview of all projects in the workspace.

**Metrics**:
- Total projects (active, archived)
- Total tasks across all projects
- Tasks by status (aggregated)
- Overdue tasks count
- Recent activity feed (last 20 actions)
- Member count and online now
- Sprint health (active sprints, tasks at risk)

### Project Dashboard
Detailed metrics for a single project.

**Metrics**:
- Task counts by status (with trend vs last week)
- Tasks by priority distribution
- Tasks by type (task, bug, story, epic)
- Overdue tasks
- Recently updated tasks
- Sprint burndown (if sprint active)
- Team velocity (last 5 sprints)
- Member workload (tasks per member)

### Sprint Burndown
Real-time progress tracking for the active sprint.

**Data points**: Expected line (ideal burndown) vs Actual line (remaining story points per day).

**Calculation**:
```
expectedRemaining(day) = totalPoints * (1 - day / sprintDays)
actualRemaining(day) = sum of story points for tasks NOT in Done status at end of day
```

Data stored in Redis sorted set: `burndown:<sprintId>` with score = day number and value = remaining points.

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | /api/v1/workspaces/:workspaceId/dashboard | workspace.read | Workspace dashboard |
| GET | /api/v1/projects/:projectId/dashboard | project.read | Project dashboard |
| GET | /api/v1/projects/:projectId/dashboard/burndown | project.read | Active sprint burndown |
| GET | /api/v1/projects/:projectId/dashboard/velocity | project.read | Sprint velocity history |
| GET | /api/v1/projects/:projectId/dashboard/workload | project.read | Member workload distribution |

## Analytics Processing

### Synchronous Queries (Read-time)

For real-time metrics that must be current:
```
GET /api/v1/projects/:projectId/dashboard
```
- SELECT COUNT(*) ... GROUP BY status (cached 30s)
- SELECT COUNT(*) WHERE due_date < NOW() AND status != 'done' (cached 30s)
- SELECT ... activity_logs WHERE project_id = X ORDER BY created_at DESC LIMIT 20 (cached 60s)

These run as lightweight aggregate queries with Redis caching. The cache TTL is short because dashboard accuracy matters for active projects.

### Asynchronous Processing (BullMQ)

For historical or computationally expensive metrics:

| Job | Queue | Frequency | Description |
|-----|-------|-----------|-------------|
| velocity.calculate | AnalyticsQueue | Per sprint completion | Calculate and store velocity |
| workload.compute | AnalyticsQueue | Hourly | Compute task distribution per member |
| trends.aggregate | AnalyticsQueue | Daily | Week-over-week trend data |
| burndown.snapshot | AnalyticsQueue | Hourly | Snapshot sprint progress for burndown |

## Cache Strategy

```typescript
const DASHBOARD_CACHE_TTL = 30; // seconds

async function getProjectDashboard(projectId: string): Promise<DashboardData> {
  const cacheKey = `dashboard:project:${projectId}`;

  // Try cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Compute
  const data = await computeProjectDashboard(projectId);

  // Cache
  await redis.setex(cacheKey, DASHBOARD_CACHE_TTL, JSON.stringify(data));
  return data;
}
```

**Cache invalidation**: On any task mutation in the project, set cache TTL to 5s (soft invalidation) rather than deleting the key. This prevents a stampede of requests recomputing simultaneously.

## Project Dashboard Response

```json
{
  "success": true,
  "data": {
    "taskCounts": {
      "backlog": 12, "todo": 8, "in_progress": 3,
      "review": 2, "done": 45, "total": 70
    },
    "priorityDistribution": {
      "critical": 2, "high": 8, "medium": 35, "low": 25
    },
    "typeDistribution": {
      "task": 50, "bug": 12, "story": 5, "epic": 3
    },
    "overdueTasks": 3,
    "recentActivity": [ /* last 20 activity entries */ ],
    "activeSprint": {
      "id": "sprint-uuid",
      "name": "Sprint 5",
      "progress": 65, // percentage
      "daysRemaining": 3
    },
    "velocity": {
      "average": 25,
      "lastSprintPoints": 22,
      "trend": "up",
      "history": [
        { "sprint": "Sprint 5", "points": 22 },
        { "sprint": "Sprint 4", "points": 28 },
        { "sprint": "Sprint 3", "points": 25 }
      ]
    },
    "workload": [
      { "userId": "uuid", "displayName": "Jane", "taskCount": 5, "unfinishedTasks": 3 }
    ]
  }
}
```

## Workload Distribution

**Calculation**: For each project member, count active tasks (status in todo, in_progress, review). Normalize by member availability (future).

**Query**:
```sql
SELECT
  u.id AS user_id,
  u.display_name,
  COUNT(ta.task_id) AS task_count,
  COUNT(ta.task_id) FILTER (WHERE t.status NOT IN ('done', 'archived')) AS unfinished_tasks
FROM project_members pm
JOIN users u ON u.id = pm.user_id
LEFT JOIN task_assignees ta ON ta.user_id = u.id
LEFT JOIN tasks t ON t.id = ta.task_id AND t.project_id = $1 AND t.deleted_at IS NULL
WHERE pm.project_id = $1 AND pm.deleted_at IS NULL
GROUP BY u.id, u.display_name
ORDER BY task_count DESC;
```

## Frontend Dashboard Components

```typescript
// modules/analytics/components/
// - TaskCountChart (bar chart by status)
// - PriorityDistributionChart (pie/donut chart)
// - VelocityChart (line chart over sprints)
// - BurndownChart (line chart with expected vs actual)
// - WorkloadTable (table with progress bars)
// - OverdueTaskList (sorted list with due dates)
```

Charts use Recharts library (lightweight, React-native, Server Component compatible for static data).

## Design Decisions

- **Read-time aggregation + caching over pre-computed tables** - Dashboard metrics are computed from aggregate queries. This is sufficient for MVP scale (thousands of tasks). Pre-computed materialized views would add complexity without proportional benefit at this stage.
- **Short cache TTL (30s)** - Dashboard accuracy matters for active project management. 30s is a good balance between performance and freshness.
- **Redis over database caching** - Dashboard data is read-heavy, write-light. Redis provides sub-millisecond reads and automatic TTL-based invalidation.
- **Recharts over Chart.js/D3** - Recharts works well with React declarative patterns, supports Server Components for static charts, and has a simpler API than D3 for standard chart types.

## Future Considerations

- **Advanced analytics page** - Full-page analytics with custom date ranges, export to CSV/PDF, and saved report configurations.
- **Cumulative flow diagram** - Shows task distribution across columns over time. Useful for identifying workflow bottlenecks.
- **Cycle time / lead time** - Average time from task creation to completion. Segmented by task type and priority.
- **Forecasting** - Based on historical velocity, predict completion dates for remaining sprint work or project milestones.
- **Dashboard widgets** - Customizable dashboard layout where users can add/remove/resize metric cards.
- **Real-time dashboard updates** - Metrics update in real-time via Socket.IO when tasks change, rather than waiting for cache TTL.
