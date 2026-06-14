import { Request, Response, NextFunction } from 'express';
import { CommentService } from '@/modules/comment/comment.service';
import { successResponse } from '@/shared/dto/response.dto';

export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.commentService.create(
        req.params.taskId,
        req.user!.userId,
        req.body,
      );
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  listByTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.commentService.listByTask(
        req.params.taskId,
        req.user!.userId,
        req.query as any,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.commentService.update(
        req.params.commentId,
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
      await this.commentService.delete(req.params.commentId, req.user!.userId);
      res.status(200).json(successResponse({ message: 'Comment deleted successfully' }));
    } catch (error) {
      next(error);
    }
  };
}
