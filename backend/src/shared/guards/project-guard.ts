import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@/config/database';
import { ProjectMember } from '@/modules/project/project-member.entity';
import { Project } from '@/modules/project/project.entity';
import { ForbiddenError } from '@/shared/errors/forbidden';
import { NotFoundError } from '@/shared/errors/not-found';
import { UnauthorizedError } from '@/shared/errors/unauthorized';
import { IsNull } from 'typeorm';

export interface ProjectContext {
  project: Project;
  member: ProjectMember | null;
}

export function requireProjectAccess(
  requireMembership: boolean = true,
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const projectId = req.params.projectId || req.body.projectId;
      if (!projectId) {
        throw new ForbiddenError('Project ID required');
      }

      const projectRepo = AppDataSource.getRepository(Project);
      const project = await projectRepo.findOne({
        where: { id: projectId, deletedAt: IsNull() },
      });

      if (!project) {
        throw new NotFoundError('Project');
      }

      const memberRepo = AppDataSource.getRepository(ProjectMember);
      const member = await memberRepo.findOne({
        where: {
          projectId,
          userId: req.user.userId,
          deletedAt: IsNull(),
        },
        relations: ['role'],
      });

      if (requireMembership && !member) {
        throw new ForbiddenError('Not a member of this project');
      }

      (req as any).projectContext = { project, member } as ProjectContext;

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireProjectLead(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const ctx = (req as any).projectContext as ProjectContext;
  if (!ctx || !ctx.project) {
    next(new ForbiddenError('Project context not initialized'));
    return;
  }

  if (ctx.project.leadId !== req.user!.userId) {
    next(new ForbiddenError('Only the project lead can perform this action'));
    return;
  }

  next();
}
