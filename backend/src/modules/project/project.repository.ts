import { DataSource, Repository } from 'typeorm';
import { Project } from '@/modules/project/project.entity';
import { ProjectMember } from '@/modules/project/project-member.entity';
import { ProjectCounter } from '@/modules/project/project-counter.entity';
import { IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class ProjectRepository {
  private readonly repo: Repository<Project>;
  private readonly memberRepo: Repository<ProjectMember>;
  private readonly counterRepo: Repository<ProjectCounter>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(Project);
    this.memberRepo = dataSource.getRepository(ProjectMember);
    this.counterRepo = dataSource.getRepository(ProjectCounter);
  }

  async findById(id: string): Promise<Project | null> {
    return this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async findByKeyAndWorkspace(key: string, workspaceId: string): Promise<Project | null> {
    return this.repo.findOne({
      where: { key: key.toUpperCase(), workspaceId, deletedAt: IsNull() },
    });
  }

  async findByWorkspaceId(
    workspaceId: string,
    options?: { status?: string; search?: string; page?: number; limit?: number },
  ): Promise<{ projects: Project[]; total: number }> {
    const qb = this.repo.createQueryBuilder('p')
      .where('p.workspaceId = :workspaceId', { workspaceId })
      .andWhere('p.deletedAt IS NULL');

    if (options?.status) {
      qb.andWhere('p.status = :status', { status: options.status });
    }

    if (options?.search) {
      qb.andWhere('(p.name ILIKE :search OR p.key ILIKE :search)', {
        search: `%${options.search}%`,
      });
    }

    qb.orderBy('p.createdAt', 'DESC');

    const total = await qb.getCount();

    if (options?.page && options?.limit) {
      qb.skip((options.page - 1) * options.limit);
      qb.take(options.limit);
    }

    const projects = await qb.getMany();
    return { projects, total };
  }

  async create(data: Partial<Project>): Promise<Project> {
    const project = this.repo.create({
      id: uuidv4(),
      ...data,
    });
    return this.repo.save(project);
  }

  async update(id: string, data: Partial<Project>): Promise<Project | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  // Counter for sequential IDs
  async getNextSequentialId(projectId: string): Promise<number> {
    let counter = await this.counterRepo.findOne({
      where: { projectId },
    });

    if (!counter) {
      counter = this.counterRepo.create({
        projectId,
        lastSequentialId: 0,
      });
    }

    counter.lastSequentialId += 1;
    await this.counterRepo.save(counter);
    return counter.lastSequentialId;
  }

  // Member operations
  async findMember(projectId: string, userId: string): Promise<ProjectMember | null> {
    return this.memberRepo.findOne({
      where: { projectId, userId, deletedAt: IsNull() },
      relations: ['role', 'user'],
    });
  }

  async findMembers(projectId: string): Promise<ProjectMember[]> {
    return this.memberRepo.find({
      where: { projectId, deletedAt: IsNull() },
      relations: ['role', 'user'],
      order: { createdAt: 'ASC' },
    });
  }

  async isMember(projectId: string, userId: string): Promise<boolean> {
    const count = await this.memberRepo.count({
      where: { projectId, userId, deletedAt: IsNull() },
    });
    return count > 0;
  }

  async addMember(data: Partial<ProjectMember>): Promise<ProjectMember> {
    const member = this.memberRepo.create({
      id: uuidv4(),
      ...data,
    });
    return this.memberRepo.save(member);
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    await this.memberRepo.softDelete({ projectId, userId });
  }

  async countMembers(projectId: string): Promise<number> {
    return this.memberRepo.count({
      where: { projectId, deletedAt: IsNull() },
    });
  }
}
