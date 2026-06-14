import { Request, Response, NextFunction } from 'express';
import { TaskService } from '@/modules/task/task.service';
import { successResponse } from '@/shared/dto/response.dto';

export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.taskService.create(req.user!.userId, req.body);
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  listByProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.taskService.listByProject(
        req.params.projectId,
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
      const result = await this.taskService.getById(req.params.taskId, req.user!.userId);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.taskService.update(
        req.params.taskId,
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
      await this.taskService.delete(req.params.taskId, req.user!.userId);
      res.status(200).json(successResponse({ message: 'Task deleted successfully' }));
    } catch (error) {
      next(error);
    }
  };

  changeStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.taskService.changeStatus(
        req.params.taskId,
        req.user!.userId,
        req.body,
      );
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  assignUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.taskService.assignUser(
        req.params.taskId,
        req.user!.userId,
        req.body.userId,
      );
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  removeAssignee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.taskService.removeAssignee(
        req.params.taskId,
        req.user!.userId,
        req.params.userId,
      );
      res.status(200).json(successResponse({ message: 'Assignee removed successfully' }));
    } catch (error) {
      next(error);
    }
  };

  addDependency = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.taskService.addDependency(
        req.params.taskId,
        req.user!.userId,
        req.body.dependsOnTaskId,
        req.body.type,
      );
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  removeDependency = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.taskService.removeDependency(
        req.params.taskId,
        req.user!.userId,
        req.params.dependsOnTaskId,
      );
      res.status(200).json(successResponse({ message: 'Dependency removed successfully' }));
    } catch (error) {
      next(error);
    }
  };
}
