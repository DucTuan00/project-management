import { AppDataSource } from '@/config/database';
import { Task } from '@/modules/task/task.entity';
import { TaskAssignee } from '@/modules/task/task-assignee.entity';
import { TaskDependency } from '@/modules/task/task-dependency.entity';
import { IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

const taskRepository = AppDataSource.getRepository(Task);
const taskAssigneeRepository = AppDataSource.getRepository(TaskAssignee);
const taskDependencyRepository = AppDataSource.getRepository(TaskDependency);

export class TaskRepository {
  static async findById(id: string): Promise<Task | null> {
    return taskRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['assignees', 'assignees.user', 'project'],
    });
  }

  static async findByIdSimple(id: string): Promise<Task | null> {
    return taskRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  static async findByProjectId(
    projectId: string,
    options?: {
      status?: string;
      priority?: string;
      type?: string;
      assigneeId?: string;
      sprintId?: string;
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ): Promise<{ tasks: Task[]; total: number }> {
    const qb = taskRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.assignees', 'ta', 'ta.taskId = t.id')
      .leftJoinAndSelect('ta.user', 'u', 'u.id = ta.userId')
      .where('t.projectId = :projectId', { projectId })
      .andWhere('t.deletedAt IS NULL');

    if (options?.status) {
      qb.andWhere('t.status = :status', { status: options.status });
    }

    if (options?.priority) {
      qb.andWhere('t.priority = :priority', { priority: options.priority });
    }

    if (options?.type) {
      qb.andWhere('t.type = :type', { type: options.type });
    }

    if (options?.sprintId) {
      qb.andWhere('t.sprintId = :sprintId', { sprintId: options.sprintId });
    }

    if (options?.assigneeId) {
      qb.innerJoin('t.assignees', 'filterTa', 'filterTa.userId = :assigneeId', {
        assigneeId: options.assigneeId,
      });
    }

    if (options?.search) {
      qb.andWhere('(t.title ILIKE :search OR t.description ILIKE :search)', {
        search: `%${options.search}%`,
      });
    }

    const total = await qb.getCount();

    const sortField = options?.sortBy || 'position';
    const sortOrder = options?.sortOrder || 'ASC';
    qb.orderBy(`t.${sortField}`, sortOrder);

    if (options?.page && options?.limit) {
      qb.skip((options.page - 1) * options.limit);
      qb.take(options.limit);
    }

    const tasks = await qb.getMany();
    return { tasks, total };
  }

  static async findByBoardColumn(
    projectId: string,
    boardColumnId: string,
  ): Promise<Task[]> {
    return taskRepository.find({
      where: {
        projectId,
        boardColumnId,
        deletedAt: IsNull(),
      },
      relations: ['assignees', 'assignees.user'],
      order: { position: 'ASC' },
    });
  }

  static async findByParentTaskId(parentTaskId: string): Promise<Task[]> {
    return taskRepository.find({
      where: { parentTaskId, deletedAt: IsNull() },
      order: { position: 'ASC' },
    });
  }

  static async create(data: Partial<Task>): Promise<Task> {
    const task = taskRepository.create({
      id: uuidv4(),
      ...data,
    });
    return taskRepository.save(task);
  }

  static async update(id: string, data: Partial<Task>): Promise<Task | null> {
    await taskRepository.update(id, data);
    return this.findById(id);
  }

  static async delete(id: string): Promise<void> {
    await taskRepository.softDelete(id);
  }

  // Batch position update
  static async batchUpdatePositions(
    updates: Array<{ taskId: string; position: number; boardColumnId: string }>,
  ): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const update of updates) {
        await queryRunner.manager.update(Task, update.taskId, {
          position: update.position,
          boardColumnId: update.boardColumnId,
        });
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Assignee operations
  static async findAssignee(taskId: string, userId: string): Promise<TaskAssignee | null> {
    return taskAssigneeRepository.findOne({
      where: { taskId, userId },
      relations: ['user'],
    });
  }

  static async findAssignees(taskId: string): Promise<TaskAssignee[]> {
    return taskAssigneeRepository.find({
      where: { taskId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  static async addAssignee(taskId: string, userId: string): Promise<TaskAssignee> {
    const existing = await this.findAssignee(taskId, userId);
    if (existing) {
      return existing;
    }

    const assignee = taskAssigneeRepository.create({
      id: uuidv4(),
      taskId,
      userId,
    });
    return taskAssigneeRepository.save(assignee);
  }

  static async removeAssignee(taskId: string, userId: string): Promise<void> {
    await taskAssigneeRepository.delete({ taskId, userId });
  }

  static async clearAssignees(taskId: string): Promise<void> {
    await taskAssigneeRepository.delete({ taskId });
  }

  // Dependency operations
  static async findDependency(
    taskId: string,
    dependsOnTaskId: string,
  ): Promise<TaskDependency | null> {
    return taskDependencyRepository.findOne({
      where: { taskId, dependsOnTaskId },
    });
  }

  static async findDependencies(taskId: string): Promise<TaskDependency[]> {
    return taskDependencyRepository.find({
      where: { taskId },
      relations: ['dependsOnTask'],
    });
  }

  static async findDependents(taskId: string): Promise<TaskDependency[]> {
    return taskDependencyRepository.find({
      where: { dependsOnTaskId: taskId },
      relations: ['task'],
    });
  }

  static async addDependency(
    taskId: string,
    dependsOnTaskId: string,
    type: string = 'blocks',
  ): Promise<TaskDependency> {
    const existing = await this.findDependency(taskId, dependsOnTaskId);
    if (existing) {
      return existing;
    }

    const dependency = taskDependencyRepository.create({
      id: uuidv4(),
      taskId,
      dependsOnTaskId,
      type,
    });
    return taskDependencyRepository.save(dependency);
  }

  static async removeDependency(taskId: string, dependsOnTaskId: string): Promise<void> {
    await taskDependencyRepository.delete({ taskId, dependsOnTaskId });
  }

  // Get max position in a column
  static async getMaxPosition(projectId: string, boardColumnId: string): Promise<number> {
    const result = await taskRepository
      .createQueryBuilder('t')
      .select('MAX(t.position)', 'maxPos')
      .where('t.projectId = :projectId', { projectId })
      .andWhere('t.boardColumnId = :boardColumnId', { boardColumnId })
      .andWhere('t.deletedAt IS NULL')
      .getRawOne();

    return result?.maxPos || 0;
  }
}
