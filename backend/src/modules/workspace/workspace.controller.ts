import { Request, Response, NextFunction } from 'express';
import { WorkspaceService } from '@/modules/workspace/workspace.service';
import { successResponse } from '@/shared/dto/response.dto';

export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.workspaceService.create(req.user!.userId, req.body);
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  listUserWorkspaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.workspaceService.listUserWorkspaces(req.user!.userId);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.workspaceService.getById(req.params.workspaceId, req.user!.userId);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.workspaceService.update(
        req.params.workspaceId,
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
      await this.workspaceService.delete(req.params.workspaceId, req.user!.userId);
      res.status(200).json(successResponse({ message: 'Workspace deleted successfully' }));
    } catch (error) {
      next(error);
    }
  };

  listMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.workspaceService.listMembers(req.params.workspaceId);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  inviteMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.workspaceService.inviteMember(
        req.params.workspaceId,
        req.user!.userId,
        req.body,
      );
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  updateMemberRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.workspaceService.updateMemberRole(
        req.params.workspaceId,
        req.user!.userId,
        req.params.memberId,
        req.body,
      );
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.workspaceService.removeMember(
        req.params.workspaceId,
        req.user!.userId,
        req.params.memberId,
      );
      res.status(200).json(successResponse({ message: 'Member removed successfully' }));
    } catch (error) {
      next(error);
    }
  };

  transferOwnership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.workspaceService.transferOwnership(
        req.params.workspaceId,
        req.user!.userId,
        req.body,
      );
      res.status(200).json(successResponse({ message: 'Ownership transferred successfully' }));
    } catch (error) {
      next(error);
    }
  };
}
