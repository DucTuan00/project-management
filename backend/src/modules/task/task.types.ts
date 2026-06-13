import { Task } from '@/modules/task/task.entity';

export interface TaskResponse {
  id: string;
  projectId: string;
  sprintId: string | null;
  parentTaskId: string | null;
  sequentialId: number;
  displayId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  type: string;
  storyPoints: number | null;
  dueDate: Date | null;
  estimatedHours: number | null;
  actualHours: number | null;
  position: number;
  boardColumnId: string;
  metadata: Record<string, any>;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  assignees?: TaskAssigneeResponse[];
  project?: { id: string; key: string; name: string };
}

export interface TaskAssigneeResponse {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
  };
  createdAt: Date;
}

export interface TaskDependencyResponse {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  type: string;
  dependsOnTask?: {
    id: string;
    displayId: string;
    title: string;
    status: string;
  };
}

export type TaskWithDetails = Omit<Task, 'project' | 'assignees'> & {
  assignees: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      email: string;
      displayName: string;
      avatarUrl: string | null;
    };
    createdAt: Date;
  }>;
  project?: {
    id: string;
    key: string;
    name: string;
  };
};

export function toTaskResponse(task: Task, projectKey?: string): TaskResponse {
  return {
    id: task.id,
    projectId: task.projectId,
    sprintId: task.sprintId,
    parentTaskId: task.parentTaskId,
    sequentialId: task.sequentialId,
    displayId: projectKey ? `${projectKey}-${task.sequentialId}` : `${task.sequentialId}`,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    type: task.type,
    storyPoints: task.storyPoints,
    dueDate: task.dueDate,
    estimatedHours: task.estimatedHours,
    actualHours: task.actualHours,
    position: task.position,
    boardColumnId: task.boardColumnId,
    metadata: task.metadata,
    createdById: task.createdById,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}
