import { TaskRepository } from '@/modules/task/task.repository';
import { ProjectRepository } from '@/modules/project/project.repository';
import {
  CreateTaskDto,
  UpdateTaskDto,
  ChangeStatusDto,
  ListTasksQuery,
  BatchUpdatePositionsDto,
  isValidTransition,
} from '@/modules/task/task.dto';
import { TaskResponse, TaskAssigneeResponse, TaskDependencyResponse, toTaskResponse, TaskWithDetails } from '@/modules/task/task.types';
import { NotFoundError } from '@/shared/errors/not-found';
import { ForbiddenError } from '@/shared/errors/forbidden';
import { AppError } from '@/shared/errors/app-error';
import { eventBus, Events } from '@/shared/event-bus/event-bus';
import { logger } from '@/shared/logger/logger';
import { createPaginatedResponse, PaginatedResult } from '@/shared/dto/pagination.dto';
import { IsNull } from 'typeorm';

export class TaskService {
  static async create(userId: string, dto: CreateTaskDto): Promise<TaskResponse> {
    // Verify project exists and user is a member
    const project = await ProjectRepository.findById(dto.projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    const isMember = await ProjectRepository.isMember(dto.projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    // Generate sequential ID
    const sequentialId = await ProjectRepository.getNextSequentialId(dto.projectId);

    // Get max position for the initial column
    const maxPosition = await TaskRepository.getMaxPosition(
      dto.projectId,
      dto.status || 'backlog',
    );

    const task = await TaskRepository.create({
      projectId: dto.projectId,
      title: dto.title,
      description: dto.description || null,
      status: dto.status || 'backlog',
      priority: dto.priority || 'medium',
      type: dto.type || 'task',
      storyPoints: dto.storyPoints || null,
      dueDate: dto.dueDate || null,
      estimatedHours: dto.estimatedHours || null,
      parentTaskId: dto.parentTaskId || null,
      sprintId: dto.sprintId || null,
      sequentialId,
      position: maxPosition + 10000,
      boardColumnId: dto.status || 'backlog',
      metadata: dto.metadata || {},
      createdById: userId,
    });

    // Add assignees
    if (dto.assigneeIds && dto.assigneeIds.length > 0) {
      for (const assigneeId of dto.assigneeIds) {
        await TaskRepository.addAssignee(task.id, assigneeId);
      }
    }

    const fullTask = await TaskRepository.findById(task.id);

    logger.info({ taskId: task.id, projectId: dto.projectId }, 'Task created');

    eventBus.emit(Events.TASK_CREATED, {
      taskId: task.id,
      projectId: dto.projectId,
      userId,
    });

    return toTaskResponse(fullTask!, project.key);
  }

  static async listByProject(
    projectId: string,
    userId: string,
    query: ListTasksQuery,
  ): Promise<PaginatedResult<TaskResponse>> {
    const project = await ProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    const isMember = await ProjectRepository.isMember(projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    const { tasks, total } = await TaskRepository.findByProjectId(projectId, {
      status: query.status,
      priority: query.priority,
      type: query.type,
      assigneeId: query.assigneeId,
      sprintId: query.sprintId,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    const data = tasks.map((t) => toTaskResponse(t, project.key));

    return createPaginatedResponse(data, total, query.page, query.limit);
  }

  static async getById(taskId: string, userId: string): Promise<TaskResponse> {
    const task = await TaskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const isMember = await ProjectRepository.isMember(task.projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    const project = await ProjectRepository.findById(task.projectId);
    return toTaskResponse(task, project?.key);
  }

  static async update(
    taskId: string,
    userId: string,
    dto: UpdateTaskDto,
  ): Promise<TaskResponse> {
    const task = await TaskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const isMember = await ProjectRepository.isMember(task.projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    const updated = await TaskRepository.update(taskId, dto);

    const project = await ProjectRepository.findById(task.projectId);

    logger.info({ taskId, userId }, 'Task updated');

    eventBus.emit(Events.TASK_UPDATED, {
      taskId,
      projectId: task.projectId,
      userId,
    });

    return toTaskResponse(updated!, project?.key);
  }

  static async delete(taskId: string, userId: string): Promise<void> {
    const task = await TaskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const isMember = await ProjectRepository.isMember(task.projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    await TaskRepository.delete(taskId);

    logger.info({ taskId, userId }, 'Task deleted');

    eventBus.emit(Events.TASK_DELETED, {
      taskId,
      projectId: task.projectId,
      userId,
    });
  }

  static async changeStatus(
    taskId: string,
    userId: string,
    dto: ChangeStatusDto,
  ): Promise<TaskResponse> {
    const task = await TaskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const isMember = await ProjectRepository.isMember(task.projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    if (!isValidTransition(task.status, dto.status)) {
      throw new AppError(
        `Invalid status transition from '${task.status}' to '${dto.status}'`,
        400,
        'INVALID_STATUS_TRANSITION',
      );
    }

    const updated = await TaskRepository.update(taskId, {
      status: dto.status,
      boardColumnId: dto.status,
    });

    const project = await ProjectRepository.findById(task.projectId);

    logger.info({ taskId, fromStatus: task.status, toStatus: dto.status, userId }, 'Task status changed');

    eventBus.emit(Events.TASK_STATUS_CHANGED, {
      taskId,
      projectId: task.projectId,
      fromStatus: task.status,
      toStatus: dto.status,
      userId,
    });

    return toTaskResponse(updated!, project?.key);
  }

  static async assignUser(
    taskId: string,
    userId: string,
    targetUserId: string,
  ): Promise<TaskAssigneeResponse> {
    const task = await TaskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const isMember = await ProjectRepository.isMember(task.projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    const assignee = await TaskRepository.addAssignee(taskId, targetUserId);
    const fullAssignee = await TaskRepository.findAssignee(taskId, targetUserId);

    logger.info({ taskId, targetUserId }, 'User assigned to task');

    eventBus.emit(Events.TASK_ASSIGNED, {
      taskId,
      projectId: task.projectId,
      assignedTo: targetUserId,
      assignedBy: userId,
    });

    return {
      id: fullAssignee!.id,
      userId: fullAssignee!.userId,
      user: {
        id: fullAssignee!.user.id,
        email: fullAssignee!.user.email,
        displayName: fullAssignee!.user.displayName,
        avatarUrl: fullAssignee!.user.avatarUrl,
      },
      createdAt: fullAssignee!.createdAt,
    };
  }

  static async removeAssignee(
    taskId: string,
    userId: string,
    targetUserId: string,
  ): Promise<void> {
    const task = await TaskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const isMember = await ProjectRepository.isMember(task.projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    await TaskRepository.removeAssignee(taskId, targetUserId);

    logger.info({ taskId, targetUserId }, 'User unassigned from task');

    eventBus.emit(Events.TASK_UNASSIGNED, {
      taskId,
      projectId: task.projectId,
      unassignedUser: targetUserId,
      removedBy: userId,
    });
  }

  static async addDependency(
    taskId: string,
    userId: string,
    dependsOnTaskId: string,
    type: string = 'blocks',
  ): Promise<TaskDependencyResponse> {
    const task = await TaskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const dependsOnTask = await TaskRepository.findByIdSimple(dependsOnTaskId);
    if (!dependsOnTask) {
      throw new NotFoundError('Depends-on task');
    }

    if (task.projectId !== dependsOnTask.projectId) {
      throw new AppError('Tasks must be in the same project', 400, 'DIFFERENT_PROJECTS');
    }

    if (taskId === dependsOnTaskId) {
      throw new AppError('A task cannot depend on itself', 400, 'SELF_DEPENDENCY');
    }

    const isMember = await ProjectRepository.isMember(task.projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    const dependency = await TaskRepository.addDependency(taskId, dependsOnTaskId, type);

    return {
      id: dependency.id,
      taskId: dependency.taskId,
      dependsOnTaskId: dependency.dependsOnTaskId,
      type: dependency.type,
    };
  }

  static async removeDependency(
    taskId: string,
    userId: string,
    dependsOnTaskId: string,
  ): Promise<void> {
    const task = await TaskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const isMember = await ProjectRepository.isMember(task.projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    await TaskRepository.removeDependency(taskId, dependsOnTaskId);
  }

  static async batchUpdatePositions(
    projectId: string,
    userId: string,
    dto: BatchUpdatePositionsDto,
  ): Promise<void> {
    const isMember = await ProjectRepository.isMember(projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    await TaskRepository.batchUpdatePositions(dto.tasks);

    logger.info({ projectId, taskCount: dto.tasks.length }, 'Batch position update');
  }
}
