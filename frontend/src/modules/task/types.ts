import { TaskStatus, TaskPriority, TaskType } from '@/lib/constants';

export interface TaskAssignee {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
  };
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  sprintId: string | null;
  parentTaskId: string | null;
  sequentialId: number;
  displayId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  storyPoints?: number | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  position: number;
  boardColumnId: string;
  metadata: Record<string, any>;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignees?: TaskAssignee[];
  project?: { id: string; key: string; name: string };
}

export interface CreateTaskRequest {
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  storyPoints?: number;
  dueDate?: string;
  estimatedHours?: number;
  parentTaskId?: string;
  assigneeIds?: string[];
  sprintId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  type?: TaskType;
  storyPoints?: number | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  sprintId?: string | null;
  parentTaskId?: string | null;
  metadata?: Record<string, any>;
}

export interface MoveTaskRequest {
  status: TaskStatus;
  boardColumnId?: string;
  position?: number;
}
