import { WorkspaceRepository } from '@/modules/workspace/workspace.repository';
import { CreateWorkspaceDto, UpdateWorkspaceDto, InviteMemberDto, UpdateMemberRoleDto, TransferOwnershipDto } from '@/modules/workspace/workspace.dto';
import { WorkspaceResponse, WorkspaceMemberResponse, toWorkspaceResponse } from '@/modules/workspace/workspace.types';
import { generateSlug } from '@/shared/utils/slug';
import { NotFoundError } from '@/shared/errors/not-found';
import { ConflictError } from '@/shared/errors/conflict';
import { ForbiddenError } from '@/shared/errors/forbidden';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { RoleRepository } from '@/modules/role/role.repository';
import { eventBus, Events } from '@/shared/event-bus/event-bus';
import { logger } from '@/shared/logger/logger';
import { v4 as uuidv4 } from 'uuid';

export class WorkspaceService {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly authRepository: AuthRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async create(userId: string, dto: CreateWorkspaceDto): Promise<WorkspaceResponse> {
    const slug = generateSlug(dto.name);

    const existing = await this.workspaceRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictError('Workspace with this name already exists');
    }

    // Get the Workspace Owner role
    const ownerRole = await this.roleRepository.findByName('Workspace Owner');
    if (!ownerRole) {
      throw new NotFoundError('Default role');
    }

    const workspace = await this.workspaceRepository.create({
      name: dto.name,
      slug,
      description: dto.description || null,
      ownerId: userId,
    });

    // Add owner as member
    await this.workspaceRepository.addMember({
      workspaceId: workspace.id,
      userId,
      roleId: ownerRole.id,
      joinedAt: new Date(),
    });

    logger.info({ workspaceId: workspace.id, userId }, 'Workspace created');

    eventBus.emit(Events.WORKSPACE_CREATED, { workspaceId: workspace.id, userId });

    return toWorkspaceResponse(workspace);
  }

  async listUserWorkspaces(userId: string): Promise<WorkspaceResponse[]> {
    const workspaces = await this.workspaceRepository.getUserWorkspaces(userId);
    return workspaces.map(toWorkspaceResponse);
  }

  async getById(workspaceId: string, userId: string): Promise<WorkspaceResponse> {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace');
    }

    const isMember = await this.workspaceRepository.isMember(workspaceId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this workspace');
    }

    return toWorkspaceResponse(workspace);
  }

  async update(
    workspaceId: string,
    userId: string,
    dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceResponse> {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace');
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenError('Only the workspace owner can update settings');
    }

    if (dto.name && dto.name !== workspace.name) {
      const newSlug = generateSlug(dto.name);
      const existing = await this.workspaceRepository.findBySlug(newSlug);
      if (existing && existing.id !== workspaceId) {
        throw new ConflictError('Workspace with this name already exists');
      }
      (dto as any).slug = newSlug;
    }

    const updated = await this.workspaceRepository.update(workspaceId, dto);
    return toWorkspaceResponse(updated!);
  }

  async delete(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace');
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenError('Only the workspace owner can delete the workspace');
    }

    await this.workspaceRepository.delete(workspaceId);
    logger.info({ workspaceId, userId }, 'Workspace deleted');
  }

  async listMembers(workspaceId: string): Promise<WorkspaceMemberResponse[]> {
    const members = await this.workspaceRepository.findMembers(workspaceId);
    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      workspaceId: m.workspaceId,
      roleId: m.roleId,
      user: {
        id: m.user.id,
        email: m.user.email,
        displayName: m.user.displayName,
        avatarUrl: m.user.avatarUrl,
      },
      role: {
        id: m.role.id,
        name: m.role.name,
        level: m.role.level,
      },
      joinedAt: m.joinedAt,
      createdAt: m.createdAt,
    }));
  }

  async inviteMember(
    workspaceId: string,
    userId: string,
    dto: InviteMemberDto,
  ): Promise<WorkspaceMemberResponse> {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace');
    }

    // Check if inviter is a member with sufficient permissions
    const inviterMember = await this.workspaceRepository.findMember(workspaceId, userId);
    if (!inviterMember) {
      throw new ForbiddenError('Not a member of this workspace');
    }

    // Find the user to invite
    const invitee = await this.authRepository.findByEmail(dto.email);
    if (!invitee) {
      throw new NotFoundError('User with this email');
    }

    // Check if already a member
    const existingMember = await this.workspaceRepository.findMember(workspaceId, invitee.id);
    if (existingMember) {
      throw new ConflictError('User is already a member of this workspace');
    }

    // Validate role exists
    const role = await this.roleRepository.findById(dto.roleId);
    if (!role) {
      throw new NotFoundError('Role');
    }

    const member = await this.workspaceRepository.addMember({
      workspaceId,
      userId: invitee.id,
      roleId: dto.roleId,
      invitedById: userId,
      joinedAt: new Date(),
    });

    const fullMember = await this.workspaceRepository.findMember(workspaceId, invitee.id);

    logger.info({ workspaceId, inviteeId: invitee.id }, 'Member invited');

    eventBus.emit(Events.WORKSPACE_MEMBER_ADDED, {
      workspaceId,
      userId: invitee.id,
      invitedBy: userId,
    });

    return {
      id: fullMember!.id,
      userId: fullMember!.userId,
      workspaceId: fullMember!.workspaceId,
      roleId: fullMember!.roleId,
      user: {
        id: fullMember!.user.id,
        email: fullMember!.user.email,
        displayName: fullMember!.user.displayName,
        avatarUrl: fullMember!.user.avatarUrl,
      },
      role: {
        id: fullMember!.role.id,
        name: fullMember!.role.name,
        level: fullMember!.role.level,
      },
      joinedAt: fullMember!.joinedAt,
      createdAt: fullMember!.createdAt,
    };
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<WorkspaceMemberResponse> {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace');
    }

    // Only owner can change roles
    if (workspace.ownerId !== userId) {
      throw new ForbiddenError('Only the workspace owner can change member roles');
    }

    const targetMember = await this.workspaceRepository.findMember(workspaceId, targetUserId);
    if (!targetMember) {
      throw new NotFoundError('Member');
    }

    const role = await this.roleRepository.findById(dto.roleId);
    if (!role) {
      throw new NotFoundError('Role');
    }

    const updated = await this.workspaceRepository.updateMemberRole(workspaceId, targetUserId, dto.roleId);
    const fullMember = await this.workspaceRepository.findMember(workspaceId, targetUserId);

    logger.info({ workspaceId, targetUserId, roleId: dto.roleId }, 'Member role updated');

    return {
      id: fullMember!.id,
      userId: fullMember!.userId,
      workspaceId: fullMember!.workspaceId,
      roleId: fullMember!.roleId,
      user: {
        id: fullMember!.user.id,
        email: fullMember!.user.email,
        displayName: fullMember!.user.displayName,
        avatarUrl: fullMember!.user.avatarUrl,
      },
      role: {
        id: fullMember!.role.id,
        name: fullMember!.role.name,
        level: fullMember!.role.level,
      },
      joinedAt: fullMember!.joinedAt,
      createdAt: fullMember!.createdAt,
    };
  }

  async removeMember(
    workspaceId: string,
    userId: string,
    targetUserId: string,
  ): Promise<void> {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace');
    }

    // Can't remove the owner
    if (targetUserId === workspace.ownerId) {
      throw new ForbiddenError('Cannot remove the workspace owner');
    }

    // Check if the user has permission (is owner or the member removing themselves)
    if (userId !== targetUserId && workspace.ownerId !== userId) {
      throw new ForbiddenError('Only the workspace owner can remove other members');
    }

    const targetMember = await this.workspaceRepository.findMember(workspaceId, targetUserId);
    if (!targetMember) {
      throw new NotFoundError('Member');
    }

    await this.workspaceRepository.removeMember(workspaceId, targetUserId);
    logger.info({ workspaceId, targetUserId }, 'Member removed');

    eventBus.emit(Events.WORKSPACE_MEMBER_REMOVED, { workspaceId, userId: targetUserId });
  }

  async transferOwnership(
    workspaceId: string,
    userId: string,
    dto: TransferOwnershipDto,
  ): Promise<void> {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace');
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenError('Only the workspace owner can transfer ownership');
    }

    const newOwnerMember = await this.workspaceRepository.findMember(workspaceId, dto.newOwnerId);
    if (!newOwnerMember) {
      throw new NotFoundError('New owner must be a workspace member');
    }

    // Get the owner role
    const ownerRole = await this.roleRepository.findByName('Workspace Owner');
    if (!ownerRole) {
      throw new NotFoundError('Owner role');
    }

    // Update workspace owner
    await this.workspaceRepository.update(workspaceId, { ownerId: dto.newOwnerId });

    // Update roles: new owner gets Owner role, old owner gets Member role
    const memberRole = await this.roleRepository.findByName('Member');
    if (memberRole) {
      await this.workspaceRepository.updateMemberRole(workspaceId, userId, memberRole.id);
    }
    await this.workspaceRepository.updateMemberRole(workspaceId, dto.newOwnerId, ownerRole.id);

    logger.info({ workspaceId, fromUserId: userId, toUserId: dto.newOwnerId }, 'Ownership transferred');
  }
}
