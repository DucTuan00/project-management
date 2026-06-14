import { ProjectRepository } from '@/modules/project/project.repository';
import { WorkspaceRepository } from '@/modules/workspace/workspace.repository';
import { CreateProjectDto, UpdateProjectDto, AddMemberDto, ListProjectsQuery } from '@/modules/project/project.dto';
import { ProjectResponse, ProjectMemberResponse, toProjectResponse } from '@/modules/project/project.types';
import { generateProjectKey } from '@/shared/utils/slug';
import { NotFoundError } from '@/shared/errors/not-found';
import { ConflictError } from '@/shared/errors/conflict';
import { ForbiddenError } from '@/shared/errors/forbidden';
import { RoleRepository } from '@/modules/role/role.repository';
import { eventBus, Events } from '@/shared/event-bus/event-bus';
import { logger } from '@/shared/logger/logger';
import { createPaginatedResponse, PaginatedResult } from '@/shared/dto/pagination.dto';

export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async create(userId: string, dto: CreateProjectDto): Promise<ProjectResponse> {
    // Verify workspace exists and user is a member
    const workspace = await this.workspaceRepository.findById(dto.workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace');
    }

    const isMember = await this.workspaceRepository.isMember(dto.workspaceId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this workspace');
    }

    const key = dto.key || generateProjectKey(dto.name);

    // Check for duplicate key within workspace
    const existing = await this.projectRepository.findByKeyAndWorkspace(key, dto.workspaceId);
    if (existing) {
      throw new ConflictError(`Project with key '${key}' already exists in this workspace`);
    }

    const leadId = dto.leadId || userId;

    // Verify lead is a workspace member
    const leadIsMember = await this.workspaceRepository.isMember(dto.workspaceId, leadId);
    if (!leadIsMember) {
      throw new ForbiddenError('Lead must be a workspace member');
    }

    const project = await this.projectRepository.create({
      workspaceId: dto.workspaceId,
      name: dto.name,
      key: key.toUpperCase(),
      description: dto.description || null,
      leadId,
    });

    // Add lead as project member
    const memberRole = await this.roleRepository.findByName('Member');
    if (memberRole) {
      await this.projectRepository.addMember({
        projectId: project.id,
        userId: leadId,
        roleId: memberRole.id,
      });
    }

    logger.info({ projectId: project.id, workspaceId: dto.workspaceId, userId }, 'Project created');

    eventBus.emit(Events.PROJECT_CREATED, {
      projectId: project.id,
      workspaceId: dto.workspaceId,
      userId,
    });

    return toProjectResponse(project);
  }

  async listByWorkspace(
    workspaceId: string,
    userId: string,
    query: ListProjectsQuery,
  ): Promise<PaginatedResult<ProjectResponse>> {
    // Verify workspace exists and user is a member
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace');
    }

    const isMember = await this.workspaceRepository.isMember(workspaceId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this workspace');
    }

    const { projects, total } = await this.projectRepository.findByWorkspaceId(workspaceId, {
      status: query.status,
      search: query.search,
      page: query.page,
      limit: query.limit,
    });

    const data = projects.map(toProjectResponse);

    return createPaginatedResponse(data, total, query.page, query.limit);
  }

  async getById(projectId: string, userId: string): Promise<ProjectResponse> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    const isMember = await this.projectRepository.isMember(projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    return toProjectResponse(project);
  }

  async update(
    projectId: string,
    userId: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectResponse> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    const isMember = await this.projectRepository.isMember(projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    // Only project lead or workspace admin can update
    if (project.leadId !== userId) {
      const member = await this.projectRepository.findMember(projectId, userId);
      if (!member || !member.role || member.role.level < 40) {
        throw new ForbiddenError('Only the project lead or higher can update project settings');
      }
    }

    const updated = await this.projectRepository.update(projectId, dto);
    return toProjectResponse(updated!);
  }

  async delete(projectId: string, userId: string): Promise<void> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.leadId !== userId) {
      throw new ForbiddenError('Only the project lead can delete the project');
    }

    await this.projectRepository.delete(projectId);
    logger.info({ projectId, userId }, 'Project deleted');
  }

  async listMembers(projectId: string, userId: string): Promise<ProjectMemberResponse[]> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    const isMember = await this.projectRepository.isMember(projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    const members = await this.projectRepository.findMembers(projectId);

    return members.map((m) => ({
      id: m.id,
      projectId: m.projectId,
      userId: m.userId,
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
      },
      createdAt: m.createdAt,
    }));
  }

  async addMember(
    projectId: string,
    userId: string,
    dto: AddMemberDto,
  ): Promise<ProjectMemberResponse> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    // Check if the user has permission to add members
    const member = await this.projectRepository.findMember(projectId, userId);
    if (!member) {
      throw new ForbiddenError('Not a member of this project');
    }

    // Check if target user is a workspace member
    const targetIsWorkspaceMember = await this.workspaceRepository.isMember(
      project.workspaceId,
      dto.userId,
    );
    if (!targetIsWorkspaceMember) {
      throw new ForbiddenError('User must be a workspace member to be added to the project');
    }

    // Check if already a member
    const existingMember = await this.projectRepository.findMember(projectId, dto.userId);
    if (existingMember) {
      throw new ConflictError('User is already a member of this project');
    }

    const role = await this.roleRepository.findById(dto.roleId);
    if (!role) {
      throw new NotFoundError('Role');
    }

    const newMember = await this.projectRepository.addMember({
      projectId,
      userId: dto.userId,
      roleId: dto.roleId,
    });

    const fullMember = await this.projectRepository.findMember(projectId, dto.userId);

    logger.info({ projectId, userId: dto.userId }, 'Project member added');

    eventBus.emit(Events.PROJECT_MEMBER_ADDED, {
      projectId,
      userId: dto.userId,
      addedBy: userId,
    });

    return {
      id: fullMember!.id,
      projectId: fullMember!.projectId,
      userId: fullMember!.userId,
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
      },
      createdAt: fullMember!.createdAt,
    };
  }

  async removeMember(
    projectId: string,
    userId: string,
    targetUserId: string,
  ): Promise<void> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project');
    }

    // Only project lead can remove members
    if (project.leadId !== userId) {
      throw new ForbiddenError('Only the project lead can remove members');
    }

    const targetMember = await this.projectRepository.findMember(projectId, targetUserId);
    if (!targetMember) {
      throw new NotFoundError('Member');
    }

    await this.projectRepository.removeMember(projectId, targetUserId);

    logger.info({ projectId, targetUserId }, 'Project member removed');

    eventBus.emit(Events.PROJECT_MEMBER_REMOVED, {
      projectId,
      userId: targetUserId,
      removedBy: userId,
    });
  }
}
