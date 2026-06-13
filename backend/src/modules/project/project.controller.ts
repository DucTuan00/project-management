import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '@/modules/project/project.service';
import { successResponse } from '@/shared/dto/response.dto';

export class ProjectController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProjectService.create(req.user!.userId, {
        ...req.body,
        workspaceId: req.params.workspaceId,
      });
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async listByWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProjectService.listByWorkspace(
        req.params.workspaceId,
        req.user!.userId,
        req.query as any,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProjectService.getById(req.params.projectId, req.user!.userId);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProjectService.update(
        req.params.projectId,
        req.user!.userId,
        req.body,
      );
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ProjectService.delete(req.params.projectId, req.user!.userId);
      res.status(200).json(successResponse({ message: 'Project deleted successfully' }));
    } catch (error) {
      next(error);
    }
  }

  static async listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProjectService.listMembers(req.params.projectId, req.user!.userId);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProjectService.addMember(
        req.params.projectId,
        req.user!.userId,
        req.body,
      );
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ProjectService.removeMember(
        req.params.projectId,
        req.user!.userId,
        req.params.memberId,
      );
      res.status(200).json(successResponse({ message: 'Member removed successfully' }));
    } catch (error) {
      next(error);
    }
  }
}
