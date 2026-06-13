import { Request, Response, NextFunction } from 'express';
import { KanbanService } from '@/modules/kanban/kanban.service';
import { successResponse } from '@/shared/dto/response.dto';

export class KanbanController {
  static async getBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await KanbanService.getBoard(req.params.projectId, req.user!.userId);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async batchUpdatePositions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await KanbanService.batchUpdatePositions(
        req.params.projectId,
        req.user!.userId,
        req.body,
      );
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }
}
