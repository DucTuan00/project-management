import { DataSource, Repository } from 'typeorm';
import { Workspace } from '@/modules/workspace/workspace.entity';
import { WorkspaceMember } from '@/modules/workspace/workspace-member.entity';
import { IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class WorkspaceRepository {
  private readonly repo: Repository<Workspace>;
  private readonly memberRepo: Repository<WorkspaceMember>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(Workspace);
    this.memberRepo = dataSource.getRepository(WorkspaceMember);
  }

  async findById(id: string): Promise<Workspace | null> {
    return this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async findBySlug(slug: string): Promise<Workspace | null> {
    return this.repo.findOne({
      where: { slug, deletedAt: IsNull() },
    });
  }

  async findByOwnerId(ownerId: string): Promise<Workspace[]> {
    return this.repo.find({
      where: { ownerId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: Partial<Workspace>): Promise<Workspace> {
    const workspace = this.repo.create({
      id: uuidv4(),
      ...data,
    });
    return this.repo.save(workspace);
  }

  async update(id: string, data: Partial<Workspace>): Promise<Workspace | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  // Member operations
  async findMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    return this.memberRepo.findOne({
      where: { workspaceId, userId, deletedAt: IsNull() },
      relations: ['role', 'user'],
    });
  }

  async findMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return this.memberRepo.find({
      where: { workspaceId, deletedAt: IsNull() },
      relations: ['role', 'user'],
      order: { createdAt: 'ASC' },
    });
  }

  async isMember(workspaceId: string, userId: string): Promise<boolean> {
    const count = await this.memberRepo.count({
      where: { workspaceId, userId, deletedAt: IsNull() },
    });
    return count > 0;
  }

  async addMember(data: Partial<WorkspaceMember>): Promise<WorkspaceMember> {
    const member = this.memberRepo.create({
      id: uuidv4(),
      ...data,
    });
    return this.memberRepo.save(member);
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    roleId: string,
  ): Promise<WorkspaceMember | null> {
    await this.memberRepo.update(
      { workspaceId, userId, deletedAt: IsNull() },
      { roleId },
    );
    return this.findMember(workspaceId, userId);
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await this.memberRepo.softDelete({ workspaceId, userId });
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const members = await this.memberRepo.find({
      where: { userId, deletedAt: IsNull() },
      relations: ['workspace'],
    });
    return members.map((m) => m.workspace).filter(Boolean);
  }

  async countMembers(workspaceId: string): Promise<number> {
    return this.memberRepo.count({
      where: { workspaceId, deletedAt: IsNull() },
    });
  }
}
