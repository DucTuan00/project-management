import { AppDataSource } from '@/config/database';
import { Workspace } from '@/modules/workspace/workspace.entity';
import { WorkspaceMember } from '@/modules/workspace/workspace-member.entity';
import { IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

const workspaceRepository = AppDataSource.getRepository(Workspace);
const workspaceMemberRepository = AppDataSource.getRepository(WorkspaceMember);

export class WorkspaceRepository {
  static async findById(id: string): Promise<Workspace | null> {
    return workspaceRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  static async findBySlug(slug: string): Promise<Workspace | null> {
    return workspaceRepository.findOne({
      where: { slug, deletedAt: IsNull() },
    });
  }

  static async findByOwnerId(ownerId: string): Promise<Workspace[]> {
    return workspaceRepository.find({
      where: { ownerId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  static async create(data: Partial<Workspace>): Promise<Workspace> {
    const workspace = workspaceRepository.create({
      id: uuidv4(),
      ...data,
    });
    return workspaceRepository.save(workspace);
  }

  static async update(id: string, data: Partial<Workspace>): Promise<Workspace | null> {
    await workspaceRepository.update(id, data);
    return this.findById(id);
  }

  static async delete(id: string): Promise<void> {
    await workspaceRepository.softDelete(id);
  }

  // Member operations
  static async findMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    return workspaceMemberRepository.findOne({
      where: { workspaceId, userId, deletedAt: IsNull() },
      relations: ['role', 'user'],
    });
  }

  static async findMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return workspaceMemberRepository.find({
      where: { workspaceId, deletedAt: IsNull() },
      relations: ['role', 'user'],
      order: { createdAt: 'ASC' },
    });
  }

  static async isMember(workspaceId: string, userId: string): Promise<boolean> {
    const count = await workspaceMemberRepository.count({
      where: { workspaceId, userId, deletedAt: IsNull() },
    });
    return count > 0;
  }

  static async addMember(data: Partial<WorkspaceMember>): Promise<WorkspaceMember> {
    const member = workspaceMemberRepository.create({
      id: uuidv4(),
      ...data,
    });
    return workspaceMemberRepository.save(member);
  }

  static async updateMemberRole(
    workspaceId: string,
    userId: string,
    roleId: string,
  ): Promise<WorkspaceMember | null> {
    await workspaceMemberRepository.update(
      { workspaceId, userId, deletedAt: IsNull() },
      { roleId },
    );
    return this.findMember(workspaceId, userId);
  }

  static async removeMember(workspaceId: string, userId: string): Promise<void> {
    await workspaceMemberRepository.softDelete({ workspaceId, userId });
  }

  static async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const members = await workspaceMemberRepository.find({
      where: { userId, deletedAt: IsNull() },
      relations: ['workspace'],
    });
    return members.map((m) => m.workspace).filter(Boolean);
  }

  static async countMembers(workspaceId: string): Promise<number> {
    return workspaceMemberRepository.count({
      where: { workspaceId, deletedAt: IsNull() },
    });
  }
}
