import { TaskRepository } from '@/modules/task/task.repository';
import { ProjectRepository } from '@/modules/project/project.repository';
import { BatchUpdatePositionsDto } from '@/modules/task/task.dto';
import { toTaskResponse, TaskResponse } from '@/modules/task/task.types';
import { NotFoundError } from '@/shared/errors/not-found';
import { ForbiddenError } from '@/shared/errors/forbidden';
import { AppError } from '@/shared/errors/app-error';
import { logger } from '@/shared/logger/logger';

export interface KanbanColumn {
  id: string;
  title: string;
  tasks: TaskResponse[];
}

export interface KanbanBoard {
  columns: KanbanColumn[];
}

const DEFAULT_COLUMNS: Array<{ id: string; title: string }> = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
  { id: 'archived', title: 'Archived' },
];

export class KanbanService {
  static async getBoard(projectId: string, userId: string): Promise<KanbanBoard> {
    const project = await ProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    const isMember = await ProjectRepository.isMember(projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    const columns: KanbanColumn[] = [];

    for (const col of DEFAULT_COLUMNS) {
      const tasks = await TaskRepository.findByBoardColumn(projectId, col.id);
      columns.push({
        id: col.id,
        title: col.title,
        tasks: tasks.map((t) => toTaskResponse(t, project.key)),
      });
    }

    return { columns };
  }

  static async batchUpdatePositions(
    projectId: string,
    userId: string,
    dto: BatchUpdatePositionsDto,
  ): Promise<KanbanBoard> {
    const project = await ProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    const isMember = await ProjectRepository.isMember(projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    // Validate all tasks belong to this project
    for (const item of dto.tasks) {
      const task = await TaskRepository.findByIdSimple(item.taskId);
      if (!task || task.projectId !== projectId) {
        throw new AppError(
          `Task ${item.taskId} does not belong to this project`,
          400,
          'INVALID_TASK',
        );
      }
    }

    // Apply position updates
    await TaskRepository.batchUpdatePositions(dto.tasks);

    logger.info(
      { projectId, taskCount: dto.tasks.length },
      'Kanban positions updated',
    );

    // Return the updated board
    return this.getBoard(projectId, userId);
  }

  // Fractional indexing helpers
  static calculateMoveWithinColumn(
    tasks: TaskResponse[],
    draggedTaskId: string,
    targetIndex: number,
  ): number {
    const filtered = tasks.filter((t) => t.id !== draggedTaskId);

    if (filtered.length === 0) return 10000;

    if (targetIndex <= 0) {
      return filtered[0].position - 10000;
    }

    if (targetIndex >= filtered.length) {
      return filtered[filtered.length - 1].position + 10000;
    }

    const prev = filtered[targetIndex - 1].position;
    const next = filtered[targetIndex].position;

    return (prev + next) / 2;
  }

  static calculateMoveAcrossColumn(
    tasks: TaskResponse[],
    _draggedTaskId: string,
  ): number {
    if (tasks.length === 0) return 10000;
    const maxPos = Math.max(...tasks.map((t) => t.position));
    return maxPos + 10000;
  }

  static needsRebalance(position: number): boolean {
    // Check if position is too close to another position (precision limit)
    return position < 0.001 || position > Number.MAX_SAFE_INTEGER / 2;
  }

  static async rebalanceColumn(projectId: string, boardColumnId: string): Promise<void> {
    const tasks = await TaskRepository.findByBoardColumn(projectId, boardColumnId);

    if (tasks.length <= 1) return;

    const updates = tasks.map((task, index) => ({
      taskId: task.id,
      position: (index + 1) * 10000,
      boardColumnId,
    }));

    await TaskRepository.batchUpdatePositions(updates);

    logger.info(
      { projectId, boardColumnId, taskCount: tasks.length },
      'Column positions rebalanced',
    );
  }
}
