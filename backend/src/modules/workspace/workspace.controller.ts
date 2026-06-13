import { Request, Response, NextFunction } from 'express';
import { WorkspaceService } from '@/modules/workspace/workspace.service';
import { successResponse } from '@/shared/dto/response.dto';

export class WorkspaceController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await WorkspaceService.create(req.user!.userId, req.body);
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async listUserWorkspaces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await WorkspaceService.listUserWorkspaces(req.user!.userId);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await WorkspaceService.getById(req.params.workspaceId, req.user!.userId);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await WorkspaceService.update(
        req.params.workspaceId,
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
      await WorkspaceService.delete(req.params.workspaceId, req.user!.userId);
      res.status(200).json(successResponse({ message: 'Workspace deleted successfully' }));
    } catch (error) {
      next(error);
    }
  }

  static async listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await WorkspaceService.listMembers(req.params.workspaceId);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async inviteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await WorkspaceService.inviteMember(
        req.params.workspaceId,
        req.user!.userId,
        req.body,
      );
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await WorkspaceService.updateMemberRole(
        req.params.workspaceId,
        req.user!.userId,
        req.params.memberId,
        req.body,
      );
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await WorkspaceService.removeMember(
        req.params.workspaceId,
        req.user!.userId,
        req.params.memberId,
      );
      res.status(200).json(successResponse({ message: 'Member removed successfully' }));
    } catch (error) {
      next(error);
    }
  }

  static async transferOwnership(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await WorkspaceService.transferOwnership(
        req.params.workspaceId,
        req.user!.userId,
        req.body,
      );
      res.status(200).json(successResponse({ message: 'Ownership transferred successfully' }));
    } catch (error) {
      next(error);
    }
  }
}
