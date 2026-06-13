import { AppDataSource } from '@/config/database';
import { Project } from '@/modules/project/project.entity';
import { ProjectMember } from '@/modules/project/project-member.entity';
import { ProjectCounter } from '@/modules/project/project-counter.entity';
import { IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

const projectRepository = AppDataSource.getRepository(Project);
const projectMemberRepository = AppDataSource.getRepository(ProjectMember);
const projectCounterRepository = AppDataSource.getRepository(ProjectCounter);

export class ProjectRepository {
  static async findById(id: string): Promise<Project | null> {
    return projectRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  static async findByKeyAndWorkspace(key: string, workspaceId: string): Promise<Project | null> {
    return projectRepository.findOne({
      where: { key: key.toUpperCase(), workspaceId, deletedAt: IsNull() },
    });
  }

  static async findByWorkspaceId(
    workspaceId: string,
    options?: { status?: string; search?: string; page?: number; limit?: number },
  ): Promise<{ projects: Project[]; total: number }> {
    const qb = projectRepository.createQueryBuilder('p')
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

  static async create(data: Partial<Project>): Promise<Project> {
    const project = projectRepository.create({
      id: uuidv4(),
      ...data,
    });
    return projectRepository.save(project);
  }

  static async update(id: string, data: Partial<Project>): Promise<Project | null> {
    await projectRepository.update(id, data);
    return this.findById(id);
  }

  static async delete(id: string): Promise<void> {
    await projectRepository.softDelete(id);
  }

  // Counter for sequential IDs
  static async getNextSequentialId(projectId: string): Promise<number> {
    let counter = await projectCounterRepository.findOne({
      where: { projectId },
    });

    if (!counter) {
      counter = projectCounterRepository.create({
        projectId,
        lastSequentialId: 0,
      });
    }

    counter.lastSequentialId += 1;
    await projectCounterRepository.save(counter);
    return counter.lastSequentialId;
  }

  // Member operations
  static async findMember(projectId: string, userId: string): Promise<ProjectMember | null> {
    return projectMemberRepository.findOne({
      where: { projectId, userId, deletedAt: IsNull() },
      relations: ['role', 'user'],
    });
  }

  static async findMembers(projectId: string): Promise<ProjectMember[]> {
    return projectMemberRepository.find({
      where: { projectId, deletedAt: IsNull() },
      relations: ['role', 'user'],
      order: { createdAt: 'ASC' },
    });
  }

  static async isMember(projectId: string, userId: string): Promise<boolean> {
    const count = await projectMemberRepository.count({
      where: { projectId, userId, deletedAt: IsNull() },
    });
    return count > 0;
  }

  static async addMember(data: Partial<ProjectMember>): Promise<ProjectMember> {
    const member = projectMemberRepository.create({
      id: uuidv4(),
      ...data,
    });
    return projectMemberRepository.save(member);
  }

  static async removeMember(projectId: string, userId: string): Promise<void> {
    await projectMemberRepository.softDelete({ projectId, userId });
  }

  static async countMembers(projectId: string): Promise<number> {
    return projectMemberRepository.count({
      where: { projectId, deletedAt: IsNull() },
    });
  }
}
