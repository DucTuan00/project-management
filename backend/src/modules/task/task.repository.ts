import { DataSource, Repository } from 'typeorm';
import { Task } from '@/modules/task/task.entity';
import { TaskAssignee } from '@/modules/task/task-assignee.entity';
import { TaskDependency } from '@/modules/task/task-dependency.entity';
import { IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class TaskRepository {
  private readonly repo: Repository<Task>;
  private readonly assigneeRepo: Repository<TaskAssignee>;
  private readonly dependencyRepo: Repository<TaskDependency>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(Task);
    this.assigneeRepo = dataSource.getRepository(TaskAssignee);
    this.dependencyRepo = dataSource.getRepository(TaskDependency);
  }

  async findById(id: string): Promise<Task | null> {
    return this.repo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['assignees', 'assignees.user', 'project'],
    });
  }

  async findByIdSimple(id: string): Promise<Task | null> {
    return this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async findByProjectId(
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
    const qb = this.repo
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

  async findByBoardColumn(
    projectId: string,
    boardColumnId: string,
  ): Promise<Task[]> {
    return this.repo.find({
      where: {
        projectId,
        boardColumnId,
        deletedAt: IsNull(),
      },
      relations: ['assignees', 'assignees.user'],
      order: { position: 'ASC' },
    });
  }

  async findByParentTaskId(parentTaskId: string): Promise<Task[]> {
    return this.repo.find({
      where: { parentTaskId, deletedAt: IsNull() },
      order: { position: 'ASC' },
    });
  }

  async create(data: Partial<Task>): Promise<Task> {
    const task = this.repo.create({
      id: uuidv4(),
      ...data,
    });
    return this.repo.save(task);
  }

  async update(id: string, data: Partial<Task>): Promise<Task | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  // Batch position update
  async batchUpdatePositions(
    updates: Array<{ taskId: string; position: number; boardColumnId: string }>,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
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
  async findAssignee(taskId: string, userId: string): Promise<TaskAssignee | null> {
    return this.assigneeRepo.findOne({
      where: { taskId, userId },
      relations: ['user'],
    });
  }

  async findAssignees(taskId: string): Promise<TaskAssignee[]> {
    return this.assigneeRepo.find({
      where: { taskId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async addAssignee(taskId: string, userId: string): Promise<TaskAssignee> {
    const existing = await this.findAssignee(taskId, userId);
    if (existing) {
      return existing;
    }

    const assignee = this.assigneeRepo.create({
      id: uuidv4(),
      taskId,
      userId,
    });
    return this.assigneeRepo.save(assignee);
  }

  async removeAssignee(taskId: string, userId: string): Promise<void> {
    await this.assigneeRepo.delete({ taskId, userId });
  }

  async clearAssignees(taskId: string): Promise<void> {
    await this.assigneeRepo.delete({ taskId });
  }

  // Dependency operations
  async findDependency(
    taskId: string,
    dependsOnTaskId: string,
  ): Promise<TaskDependency | null> {
    return this.dependencyRepo.findOne({
      where: { taskId, dependsOnTaskId },
    });
  }

  async findDependencies(taskId: string): Promise<TaskDependency[]> {
    return this.dependencyRepo.find({
      where: { taskId },
      relations: ['dependsOnTask'],
    });
  }

  async findDependents(taskId: string): Promise<TaskDependency[]> {
    return this.dependencyRepo.find({
      where: { dependsOnTaskId: taskId },
      relations: ['task'],
    });
  }

  async addDependency(
    taskId: string,
    dependsOnTaskId: string,
    type: string = 'blocks',
  ): Promise<TaskDependency> {
    const existing = await this.findDependency(taskId, dependsOnTaskId);
    if (existing) {
      return existing;
    }

    const dependency = this.dependencyRepo.create({
      id: uuidv4(),
      taskId,
      dependsOnTaskId,
      type,
    });
    return this.dependencyRepo.save(dependency);
  }

  async removeDependency(taskId: string, dependsOnTaskId: string): Promise<void> {
    await this.dependencyRepo.delete({ taskId, dependsOnTaskId });
  }

  // Get max position in a column
  async getMaxPosition(projectId: string, boardColumnId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('t')
      .select('MAX(t.position)', 'maxPos')
      .where('t.projectId = :projectId', { projectId })
      .andWhere('t.boardColumnId = :boardColumnId', { boardColumnId })
      .andWhere('t.deletedAt IS NULL')
      .getRawOne();

    return result?.maxPos || 0;
  }
}
