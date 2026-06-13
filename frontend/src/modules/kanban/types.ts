import { Task, TaskStatus } from '@/modules/task/types';

export interface BoardColumn {
  id: string;
  name: string;
  taskStatus: TaskStatus;
  order: number;
  wipLimit?: number;
}

export interface BoardData {
  columns: BoardColumn[];
  tasks: Record<TaskStatus, Task[]>;
}

export interface DragPayload {
  taskId: string;
  sourceColumn: TaskStatus;
  sourceIndex: number;
  destinationColumn: TaskStatus;
  destinationIndex: number;
}
