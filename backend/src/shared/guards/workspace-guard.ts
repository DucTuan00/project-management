import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@/config/database';
import { WorkspaceMember } from '@/modules/workspace/workspace-member.entity';
import { Workspace } from '@/modules/workspace/workspace.entity';
import { ForbiddenError } from '@/shared/errors/forbidden';
import { NotFoundError } from '@/shared/errors/not-found';
import { UnauthorizedError } from '@/shared/errors/unauthorized';
import { IsNull } from 'typeorm';

export interface WorkspaceContext {
  workspace: Workspace;
  member: WorkspaceMember;
}

export function requireWorkspaceAccess(
  permissionCheck?: (member: WorkspaceMember) => boolean,
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const workspaceId = req.params.workspaceId || req.body.workspaceId;
      if (!workspaceId) {
        throw new ForbiddenError('Workspace ID required');
      }

      const workspaceRepo = AppDataSource.getRepository(Workspace);
      const workspace = await workspaceRepo.findOne({
        where: { id: workspaceId, deletedAt: IsNull() },
      });

      if (!workspace) {
        throw new NotFoundError('Workspace');
      }

      const memberRepo = AppDataSource.getRepository(WorkspaceMember);
      const member = await memberRepo.findOne({
        where: {
          workspaceId,
          userId: req.user.userId,
          deletedAt: IsNull(),
        },
        relations: ['role'],
      });

      if (!member) {
        throw new ForbiddenError('Not a member of this workspace');
      }

      if (permissionCheck && !permissionCheck(member)) {
        throw new ForbiddenError('Insufficient workspace permissions');
      }

      // Attach workspace context to request
      (req as any).workspaceContext = { workspace, member } as WorkspaceContext;

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireWorkspaceOwner(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const ctx = (req as any).workspaceContext as WorkspaceContext;
  if (!ctx || !ctx.workspace || !ctx.member) {
    next(new ForbiddenError('Workspace context not initialized'));
    return;
  }

  if (ctx.workspace.ownerId !== req.user!.userId) {
    next(new ForbiddenError('Only the workspace owner can perform this action'));
    return;
  }

  next();
}
