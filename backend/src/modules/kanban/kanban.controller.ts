import { Request, Response, NextFunction } from 'express';
import { KanbanService } from '@/modules/kanban/kanban.service';
import { successResponse } from '@/shared/dto/response.dto';

export class KanbanController {
  constructor(private readonly kanbanService: KanbanService) {}

  getBoard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.kanbanService.getBoard(req.params.projectId, req.user!.userId);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  batchUpdatePositions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.kanbanService.batchUpdatePositions(
        req.params.projectId,
        req.user!.userId,
        req.body,
      );
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };
}
