# Search System

## Purpose
Define the search system that provides full-text search across tasks within a workspace or project, with filtering, sorting, and realtime index updates.

## Responsibilities

- Full-text search over task titles and descriptions
- Filtering by status, priority, assignee, sprint, type
- Workspace-scoped and project-scoped search
- Index updates on task create/update/delete
- Typo-tolerant search
- Paginated results

## Search Architecture

**Decision**: PostgreSQL full-text search (no external search engine).

For MVP purposes, PostgreSQL's built-in full-text search (tsvector/tsquery) is sufficient. The platform does not need the scale or advanced relevance tuning of Elasticsearch or Meilisearch at this stage.

**Rationale**:
- No additional infrastructure to maintain
- Data stays in sync automatically (no index lag)
- Full ACID consistency for search results
- Sufficient performance for up to 100K tasks per workspace
- Easy to migrate to a dedicated search engine later

## Database Setup

Create a generated tsvector column on the tasks table:

```sql
ALTER TABLE tasks ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX idx_tasks_search_vector ON tasks USING GIN(search_vector);
```

**Weighting**: Title (weight A) is more important than description (weight B). This means title matches rank higher in search results.

**Trigger-based update**: The generated column automatically updates when title or description changes. No manual index management needed.

## API Endpoints

### Search tasks
```
GET /api/v1/search/tasks?q=stripe+checkout&workspaceId=uuid&projectId=uuid&status=in_progress
```

| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (required, min 2 chars) |
| workspaceId | UUID | Scope search to workspace |
| projectId | UUID | Scope search to project |
| status | string | Filter by status (comma-separated) |
| priority | string | Filter by priority |
| assigneeId | UUID | Filter by assignee |
| sprintId | UUID | Filter by sprint |
| type | string | Filter by task type |
| createdBy | UUID | Filter by creator |
| dueBefore | ISO date | Due before date |
| dueAfter | ISO date | Due after date |
| tags | string | Filter by labels/tags |
| sort | string | relevance, created_at, updated_at, due_date |
| order | asc/desc | Sort order |
| page | int | Page number |
| limit | int | Results per page (max 50) |

## Search Service Implementation

```typescript
// modules/search/search.service.ts
class SearchService {
  async searchTasks(query: SearchQuery): Promise<SearchResult> {
    const qb = this.taskRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignees', 'assignees')
      .leftJoinAndSelect('task.project', 'project')
      .where('task.deletedAt IS NULL')
      .andWhere('project.deletedAt IS NULL');

    // Full-text search
    if (query.q) {
      const tsQuery = plainto_tsquery('english', query.q);
      qb.andWhere('task.search_vector @@ :tsQuery', { tsQuery });
      qb.addOrderBy('ts_rank(task.search_vector, :tsQuery)', 'DESC');
    }

    // Apply filters
    if (query.projectId) qb.andWhere('task.projectId = :projectId', { projectId: query.projectId });
    if (query.status) qb.andWhere('task.status IN (:...statuses)', { statuses: query.status.split(',') });
    if (query.priority) qb.andWhere('task.priority = :priority', { priority: query.priority });
    if (query.assigneeId) {
      qb.andWhere('assignees.userId = :assigneeId', { assigneeId: query.assigneeId });
    }
    if (query.sprintId) qb.andWhere('task.sprintId = :sprintId OR task.sprintId IS NULL', { sprintId: query.sprintId });

    // Sorting
    if (query.sort === 'created_at') qb.addOrderBy('task.createdAt', query.order || 'DESC');
    else if (query.sort === 'updated_at') qb.addOrderBy('task.updatedAt', query.order || 'DESC');
    // Default: order by relevance (ts_rank)

    // Pagination
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 50);
    const offset = (page - 1) * limit;

    const [items, total] = await qb.skip(offset).take(limit).getManyAndCount();

    return {
      items: items.map(this.toSearchResultItem),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
```

## Search Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "task-uuid",
        "title": "Implement Stripe checkout flow",
        "status": "in_progress",
        "priority": "high",
        "type": "task",
        "projectKey": "PROJ",
        "sequentialId": 42,
        "displayId": "PROJ-42",
        "assignees": [{ "id": "uuid", "displayName": "Jane Doe" }],
        "matchContext": "...implement <mark>Stripe</mark> <mark>checkout</mark> using Stripe Elements...",
        "createdAt": "2025-01-10T08:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

The `matchContext` field shows a snippet of the description with matching terms highlighted via `<mark>` tags.

## Search Scoping

**Workspace search**: Searches across all projects the user has access to within a workspace. Requires workspace membership.

**Project search**: Searches within a single project. Requires project membership. Used on the project-level search bar.

**Global search**: From the top header bar, searches across all workspaces the user belongs to. Returns grouped results by workspace.

## Permission Enforcement

Search results are filtered by access:
1. Search query scoped to workspace or project
2. Verify user has task.read permission for the scope
3. Results only include tasks in projects where user is a member (or workspace-level role grants access)

Access filter is added to the query builder:
```typescript
if (scope === 'workspace') {
  qb.andWhere(qb => {
    const subQuery = qb.subQuery()
      .select('pm.projectId')
      .from('project_members', 'pm')
      .where('pm.userId = :userId')
      .getQuery();
    return 'task.projectId IN ' + subQuery;
  }).setParameter('userId', userId);
}
```

## Realtime Index Updates

Because the `search_vector` column is generated, it updates automatically when task title or description changes. No explicit reindexing is needed.

**Index staleness edge cases**: If a task is updated via a direct database query (not through the application), the trigger still fires because it's a generated column. No manual sync needed.

## Search Performance

**Query time target**: < 200ms for p95 of searches.

**Optimizations**:
- GIN index on `search_vector` column
- Composite B-tree indexes for common filter combinations (project_id + status, etc.)
- Limit result set to 50 items max per query
- Exclude soft-deleted records in the WHERE clause

**If performance degrades** (project grows to 50K+ tasks):
1. Add partial indexes for active projects (exclude archived)
2. Consider pg_trgm extension for fuzzy matching
3. Migrate to Meilisearch or Elasticsearch if needed

## Design Decisions

- **PostgreSQL full-text search over Elasticsearch** - Simpler infrastructure, no data sync issues, sufficient for MVP scale. The tsvector/tsquery approach handles English stemming, stop words, and ranking. Migration path to dedicated search engine is straightforward (index the same fields, same query patterns).
- **Generated column over trigger** - PostgreSQL 12+ generated columns are simpler than triggers. The `STORED` variant computes on write and stores the tsvector, avoiding recomputation on read.
- **plainto_tsquery over to_tsquery** - plainto_tsquery handles user input better by stemming each word and AND-combining them. to_tsquery requires query operators from the user, which is not appropriate for a search bar.
- **No typo tolerance** - PostgreSQL's full-text search does not support fuzzy matching natively. For typo tolerance, consider pg_trgm or Meilisearch in a future phase. The MVP returns "no results" gracefully for misspelled queries.

## Future Considerations

- **pg_trgm extension** - Add trigram-based fuzzy matching for typo tolerance. CREATE INDEX ON tasks USING GIN (title gin_trgm_ops).
- **Advanced search syntax** - Support quoted phrases, exclude terms (-term), field-specific searches (status:done priority:high).
- **Saved searches** - Users can save search queries with filters for quick access.
- **Search analytics** - Track what users search for to identify missing features or documentation needs.
- **Elasticsearch/Meilisearch migration** - When the platform exceeds 100K tasks per workspace or needs advanced relevance tuning, add a dedicated search engine with dual-write during migration.
