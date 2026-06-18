# Kanban Board

## Purpose
Define the Kanban board architecture including drag-and-drop behavior, fractional indexing algorithm, positioning strategy, and optimistic update patterns.

## Responsibilities

- Render tasks grouped by status column
- Support drag-and-drop reordering within and across columns
- Maintain consistent ordering via fractional indexing
- Enforce WIP limits
- Provide realtime board updates via Socket.IO
- Support column customization per project

## Board Data Model

The board is not a separate entity - it is a view over tasks grouped by the `board_column_id` field, ordered by `position`.

```
Board = {
  columns: Column[]           // From project settings
  tasks: Map<columnId, Task[]> // Tasks grouped by column, ordered by position
}
```

Each column in the project settings has:
```json
{
  "id": "in_progress",
  "name": "In Progress",
  "position": 3,
  "wipLimit": 5
}
```

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | /api/v1/projects/:projectId/board | task.read | Get full board data |
| PUT | /api/v1/projects/:projectId/board/position | task.update | Batch update positions |

## Drag-and-Drop Architecture

### Frontend

Uses @dnd-kit with multiple containers (one per column):

```typescript
// modules/kanban/hooks/useKanbanBoard.ts
// Manages board state with TanStack Query
// On drag end:
//   1. Capture source column, target column, new index
//   2. Apply optimistic update immediately
//   3. Call PUT /board/position with payload
//   4. On error: roll back optimistic update
//   5. On success: invalidate task queries for affected column(s)
```

### @dnd-kit Setup

```
DndContext
  +-- DragOverlay (ghost card while dragging)
  +-- SortableContext (per column, vertical list)
      +-- SortableItem (individual task card)
```

- Uses useSortable for within-column reordering
- Uses keyboardSensor and pointerSensor (with activation constraint of 5px to distinguish click from drag)
- collisionDetection: closestCorners for accurate drop between columns

## Positioning Strategy

### Fractional Indexing

Positions are DECIMAL(12,2) values that define the order of tasks within a column. The algorithm is based on inserting between two adjacent positions.

**Initial positions** on task creation: Tasks are placed at 10000, 20000, 30000, etc. (incrementing by 10000). This leaves room for insertions between them.

**Move within same column**: When a task moves between two tasks, its new position is the average of the two adjacent positions:
```
Before:  A(10000)  B(20000)  C(30000)  D(40000)
Move D between B and C:
After:   A(10000)  B(20000)  D(25000)  C(30000)
```

**Move across columns**: Task gets inserted at the end of the target column (last position + 10000) unless a specific insertion point is provided.

**Insert at top**: If inserting at index 0, use (first position / 2). If position goes below 1, rebalance the entire column (renumber all positions at even intervals).

**Edge case - position overflow**: When average of two adjacent positions rounds to the same value as one of them (precision limit), trigger a full rebalance of the affected column:
```
All tasks in column get renumbered: 10000, 20000, 30000, ...
```

## API Payload

### Get Board
```
GET /api/v1/projects/:projectId/board
Response: {
  columns: [{ id, name, position, wipLimit }],
  tasks: {
    "backlog": [{ id, title, priority, assignees, ... }],
    "todo": [...],
    ...
  }
}
```

### Update Position
```
PUT /api/v1/projects/:projectId/board/position
Request: {
  taskId: "uuid",
  columnId: "in_progress",
  position: 25000,           // New fractional index value
  previousTaskId: "uuid-b",   // Task it's after (null if first)
  nextTaskId: "uuid-c"        // Task it's before (null if last)
}

Response: {
  taskId: "uuid",
  newPosition: 25000,
  affectedTasks: [            // Other tasks that changed position
    { id: "uuid-c", newPosition: 30000 }
  ]
}
```

## Optimistic Updates

**TanStack Query mutation**:
```typescript
// In kanban/queries.ts
export function useUpdateTaskPosition(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => kanbanApi.updatePosition(projectId, payload),
    onMutate: async (payload) => {
      // 1. Cancel in-flight queries for the board
      await queryClient.cancelQueries(['project', projectId, 'board']);

      // 2. Snapshot previous state
      const previousBoard = queryClient.getQueryData(['project', projectId, 'board']);

      // 3. Optimistically update the cache
      queryClient.setQueryData(['project', projectId, 'board'], (old) => {
        // Move task from source column to target column at new position
        // Update positions of affected tasks
      });

      // 4. Return rollback function
      return { rollback: () => queryClient.setQueryData(['project', projectId, 'board'], previousBoard) };
    },
    onError: (err, vars, context) => {
      // Roll back on error
      context?.rollback();
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(['project', projectId, 'board']);
    },
  });
}
```

## Realtime Board Updates

When any user moves a task, the board must stay in sync across all connected clients:

1. **Sender applies optimistic update** - UI responds instantly
2. **API validates and persists** - Position calculated on backend
3. **Socket.IO broadcast**: Emit `board:task-moved` to `project:<id>` room with `{ taskId, columnId, newPosition, actorId }`
4. **Receivers invalidate cache**: Remove the task from its old position, insert at new position
5. **Conflict handling**: If the receiver had pending local changes to the same task, the server wins (last-write-wins). Future enhancements can use operational transforms.

## WIP Limit Enforcement

WIP limits are set per column in project settings.

**On move attempt**:
1. Frontend checks WIP limit before allowing drop
2. Backend validates WIP limit after receiving position update
3. If column is at WIP limit: return 409 CONFLICT with code COLUMN_WIP_LIMIT_EXCEEDED
4. Frontend rolls back optimistic update and displays warning toast

WIP limits are not enforced for project managers and above.

## Column Configuration

Projects can customize their columns through project settings:

| Action | Endpoint | Permission |
|--------|----------|-----------|
| Add column | PATCH project settings | project.update |
| Remove column | PATCH project settings | project.update |
| Rename column | PATCH project settings | project.update |
| Set WIP limit | PATCH project settings | project.update |
| Reorder columns | PATCH project settings | project.update |

When a column is removed, all tasks in that column are moved to the first remaining column.

## Design Decisions

- **Fractional indexing over integer gaps** - Allows O(1) insertions between any two items. Integer gap (step=10000) is simpler than string-based fractional indexing and sufficient for the expected task counts per column.
- **Batch position API** - Single endpoint for all position updates, not per-task. Reduces API calls during drag-and-drop.
- **No board-specific database table** - The board is a query projection over tasks. This reduces duplication and ensures the board always reflects the true task state.
- **Optimistic updates with rollback** - Critical for perceived performance. Drag-and-drop must feel instant; 200-500ms API latency would make the interaction feel sluggish.

## Future Considerations

- **Swimlanes** - Group tasks by assignee or epic within columns. UI toggle between flat board and swimlane view.
- **Card customization** - Show/hide fields on cards (priority, assignee, due date, story points).
- **Quick add** - Click + to add a task directly into a column without navigating to create form.
- **Horizontal scroll for many columns** - With custom workflows, projects may have 10+ columns. Virtual scrolling for columns.
