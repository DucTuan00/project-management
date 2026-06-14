import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '@/modules/project/project.service';
import { successResponse } from '@/shared/dto/response.dto';

export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.projectService.create(req.user!.userId, {
        ...req.body,
        workspaceId: req.params.workspaceId,
      });
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  listByWorkspace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.projectService.listByWorkspace(
        req.params.workspaceId,
        req.user!.userId,
        req.query as any,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.projectService.getById(req.params.projectId, req.user!.userId);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.projectService.update(
        req.params.projectId,
        req.user!.userId,
        req.body,
      );
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.projectService.delete(req.params.projectId, req.user!.userId);
      res.status(200).json(successResponse({ message: 'Project deleted successfully' }));
    } catch (error) {
      next(error);
    }
  };

  listMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.projectService.listMembers(req.params.projectId, req.user!.userId);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  addMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.projectService.addMember(
        req.params.projectId,
        req.user!.userId,
        req.body,
      );
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.projectService.removeMember(
        req.params.projectId,
        req.user!.userId,
        req.params.memberId,
      );
      res.status(200).json(successResponse({ message: 'Member removed successfully' }));
    } catch (error) {
      next(error);
    }
  };
}
