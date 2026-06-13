import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@/config/database';
import { WorkspaceMember } from '@/modules/workspace/workspace-member.entity';
import { ProjectMember } from '@/modules/project/project-member.entity';
import { Role } from '@/modules/role/role.entity';
import { RolePermission } from '@/modules/role/role-permission.entity';
import { ForbiddenError } from '@/shared/errors/forbidden';
import { UnauthorizedError } from '@/shared/errors/unauthorized';
import { IsNull } from 'typeorm';

export function requirePermission(...permissionCodes: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { userId } = req.user;
      const workspaceId = req.params.workspaceId || req.body.workspaceId;
      const projectId = req.params.projectId || req.body.projectId;

      let roleId: string | null = null;

      if (projectId) {
        const projectMemberRepo = AppDataSource.getRepository(ProjectMember);
        const projectMember = await projectMemberRepo.findOne({
          where: { projectId, userId, deletedAt: IsNull() },
        });

        if (projectMember) {
          roleId = projectMember.roleId;
        }
      }

      if (!roleId && workspaceId) {
        const workspaceMemberRepo = AppDataSource.getRepository(WorkspaceMember);
        const workspaceMember = await workspaceMemberRepo.findOne({
          where: { workspaceId, userId, deletedAt: IsNull() },
        });

        if (workspaceMember) {
          roleId = workspaceMember.roleId;
        }
      }

      if (!roleId) {
        throw new ForbiddenError('Not a member of this workspace or project');
      }

      const roleRepo = AppDataSource.getRepository(Role);
      const role = await roleRepo.findOne({
        where: { id: roleId, deletedAt: IsNull() },
      });

      if (!role) {
        throw new ForbiddenError('Role not found');
      }

      // System roles with high level have all permissions
      if (role.isSystem) {
        const rolePermissionRepo = AppDataSource.getRepository(RolePermission);
        const hasPermission = await rolePermissionRepo
          .createQueryBuilder('rp')
          .innerJoin('rp.permission', 'p', 'p.code IN (:...codes)', { codes: permissionCodes })
          .where('rp.roleId = :roleId', { roleId })
          .getCount();

        if (hasPermission === permissionCodes.length) {
          next();
          return;
        }
      }

      // Check specific permissions
      const rolePermissionRepo = AppDataSource.getRepository(RolePermission);
      const hasPermission = await rolePermissionRepo
        .createQueryBuilder('rp')
        .innerJoin('rp.permission', 'p', 'p.code IN (:...codes)', { codes: permissionCodes })
        .where('rp.roleId = :roleId', { roleId })
        .getCount();

      if (hasPermission === 0) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export async function requireWorkspaceMember(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const workspaceId = req.params.workspaceId;
    if (!workspaceId) {
      throw new ForbiddenError('Workspace ID required');
    }

    const workspaceMemberRepo = AppDataSource.getRepository(WorkspaceMember);
    const member = await workspaceMemberRepo.findOne({
      where: {
        workspaceId,
        userId: req.user.userId,
        deletedAt: IsNull(),
      },
    });

    if (!member) {
      throw new ForbiddenError('Not a member of this workspace');
    }

    (req as any).workspaceMember = member;
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireProjectMember(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const projectId = req.params.projectId;
    if (!projectId) {
      throw new ForbiddenError('Project ID required');
    }

    const projectMemberRepo = AppDataSource.getRepository(ProjectMember);
    const member = await projectMemberRepo.findOne({
      where: {
        projectId,
        userId: req.user.userId,
        deletedAt: IsNull(),
      },
    });

    if (!member) {
      throw new ForbiddenError('Not a member of this project');
    }

    (req as any).projectMember = member;
    next();
  } catch (error) {
    next(error);
  }
}
