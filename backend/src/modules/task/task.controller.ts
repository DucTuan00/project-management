import { Request, Response, NextFunction } from 'express';
import { TaskService } from '@/modules/task/task.service';
import { successResponse } from '@/shared/dto/response.dto';

export class TaskController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TaskService.create(req.user!.userId, req.body);
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async listByProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TaskService.listByProject(
        req.params.projectId,
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
      const result = await TaskService.getById(req.params.taskId, req.user!.userId);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TaskService.update(
        req.params.taskId,
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
      await TaskService.delete(req.params.taskId, req.user!.userId);
      res.status(200).json(successResponse({ message: 'Task deleted successfully' }));
    } catch (error) {
      next(error);
    }
  }

  static async changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TaskService.changeStatus(
        req.params.taskId,
        req.user!.userId,
        req.body,
      );
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async assignUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TaskService.assignUser(
        req.params.taskId,
        req.user!.userId,
        req.body.userId,
      );
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async removeAssignee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await TaskService.removeAssignee(
        req.params.taskId,
        req.user!.userId,
        req.params.userId,
      );
      res.status(200).json(successResponse({ message: 'Assignee removed successfully' }));
    } catch (error) {
      next(error);
    }
  }

  static async addDependency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TaskService.addDependency(
        req.params.taskId,
        req.user!.userId,
        req.body.dependsOnTaskId,
        req.body.type,
      );
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async removeDependency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await TaskService.removeDependency(
        req.params.taskId,
        req.user!.userId,
        req.params.dependsOnTaskId,
      );
      res.status(200).json(successResponse({ message: 'Dependency removed successfully' }));
    } catch (error) {
      next(error);
    }
  }
}
