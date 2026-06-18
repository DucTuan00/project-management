# Sprint Management

## Purpose
Define the sprint management module including sprint lifecycle, backlog grooming, velocity tracking, and sprint planning workflow.

## Responsibilities

- Sprint creation, activation, completion
- Backlog management (adding/removing tasks from sprints)
- Sprint status transitions (planning, active, completed)
- Velocity calculation from historical sprints
- Sprint burndown tracking
- Task assignment during sprint planning

## Sprint Lifecycle

```
Planning --> Active --> Completed
    ^                     |
    |                     v
    +---------<-----------+
```

If a sprint is cancelled during Active status, tasks are moved back to Backlog.

**Status definitions**:

| Status | Description |
|--------|-------------|
| planning | Sprint is being planned. Tasks can be added/removed freely. |
| active | Sprint is in progress. Tasks can be added, but not removed without admin approval. |
| completed | Sprint has ended. Unfinished tasks auto-moved to backlog or next sprint. |

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | /api/v1/projects/:projectId/sprints | sprint.create | Create sprint |
| GET | /api/v1/projects/:projectId/sprints | sprint.read | List sprints |
| GET | /api/v1/sprints/:sprintId | sprint.read | Get sprint details |
| PATCH | /api/v1/sprints/:sprintId | sprint.update | Update sprint |
| DELETE | /api/v1/sprints/:sprintId | sprint.delete | Delete sprint |
| POST | /api/v1/sprints/:sprintId/start | sprint.update | Start sprint |
| POST | /api/v1/sprints/:sprintId/complete | sprint.update | Complete sprint |
| POST | /api/v1/sprints/:sprintId/tasks | sprint.update | Add tasks to sprint |
| DELETE | /api/v1/sprints/:sprintId/tasks/:taskId | sprint.update | Remove task from sprint |
| GET | /api/v1/projects/:projectId/backlog | task.read | Get backlog |

## Sprint Creation

**Endpoint**: POST /api/v1/projects/:projectId/sprints

**Flow**:
1. Verify user has sprint.create permission
2. Validate input: name, goal, start_date, end_date
3. Validate dates: start_date before end_date, end_date not in the past
4. Auto-generate name: "Sprint N" where N = count of completed sprints + 1
5. Create sprint with status = planning
6. Emit sprint.created event
7. Return sprint

## Sprint Start (Activation)

**Endpoint**: POST /api/v1/sprints/:sprintId/start

**Flow**:
1. Verify sprint is in planning status
2. Verify sprint has at least one task (cannot start empty sprint)
3. Verify no other sprint in this project is currently active
4. Move tasks in backlog status to todo
5. Set sprint status to active, start_date to today if not set
6. Emit sprint.started event
7. Return sprint with task count

## Sprint Complete

**Endpoint**: POST /api/v1/sprints/:sprintId/complete

**Flow**:
1. Verify sprint is in active status
2. Auto-handle unfinished tasks:
   - Tasks in review or in_progress: move to backlog
   - Tasks in done: remain done
   - Store sprint completion snapshot
3. Set sprint status to completed, set completed_at
4. Calculate velocity: total story points of completed tasks
5. Update project velocity metrics
6. Emit sprint.completed event
7. Return sprint summary with velocity

## Backlog Management

The backlog is the set of tasks in a project where sprint_id IS NULL and status not archived, ordered by position.

**Add tasks to sprint**: POST /api/v1/sprints/:sprintId/tasks with array of task IDs. All tasks must belong to the same project, must not be in another active sprint. If sprint is planning, tasks are simply associated.

**Remove tasks from sprint**: DELETE endpoint. Only allowed during planning status. Task sprint_id set to NULL.

## Velocity Tracking

Velocity is calculated per sprint and stored on the project record:

```
velocity = total_story_points_completed / number_of_sprints
```

Stored in project settings JSONB:
```json
"velocity": {
  "average": 25,
  "lastSprintPoints": 22,
  "sprintCount": 8,
  "history": [
    { "sprintId": "uuid", "points": 22, "completedAt": "2025-03-01" }
  ]
}
```

Frontend shows velocity trend chart and recommends story point target based on average of last 3 sprints.

## Sprint Detail Response

```json
{
  "success": true,
  "data": {
    "id": "sprint-uuid",
    "name": "Sprint 5",
    "goal": "Complete payment integration",
    "status": "active",
    "startDate": "2025-03-01",
    "endDate": "2025-03-14",
    "tasks": [
      {
        "id": "task-uuid",
        "title": "Implement Stripe checkout",
        "status": "in_progress",
        "priority": "high",
        "assignees": [{ "id": "user-uuid", "displayName": "Jane" }],
        "storyPoints": 5
      }
    ],
    "metrics": {
      "totalTasks": 8,
      "completedTasks": 3,
      "totalStoryPoints": 32,
      "completedStoryPoints": 10
    },
    "velocity": {
      "average": 25,
      "lastSprintPoints": 28
    }
  }
}
```

## Design Decisions

- **No sprint commit freeze** - Tasks can be added during active sprint with logging. Matches how small teams work.
- **Flat backlog** - Simple list of unassigned tasks. Future enhancements may add categories or auto-sorting.
- **Velocity per project** - Velocity is meaningful only within a project context. Different projects have different scales.
- **Auto-handle unfinished on complete** - Rather than blocking completion, unfinished tasks move to backlog.

## Best Practices

1. **Overlapping sprints prevention** - Only one active sprint per project at a time. Multiple planning sprints allowed.
2. **Date validation** - end_date cannot be before start_date. BullMQ job checks approaching deadlines daily.
3. **Historical data** - Task-sprint association preserved after tasks move to new sprints. Maintains accurate velocity.
4. **Story points** - Use Fibonacci sequence (1, 2, 3, 5, 8, 13, 21). Enforced at Zod schema level.
5. **Burndown data** - Track daily remaining story points per sprint. Store in Redis sorted set for fast rendering.

## Future Considerations

- Auto-sprint creation on completion with suggested duration
- Capacity planning with team member availability
- Goal tracking (achieved/missed) with completion rate metrics
- Sprint retrospective board with action items
