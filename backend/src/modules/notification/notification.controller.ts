import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '@/modules/notification/notification.service';
import { successResponse } from '@/shared/dto/response.dto';

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  listByUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.notificationService.listByUser(
        req.user!.userId,
        req.query as any,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.notificationService.getUnreadCount(req.user!.userId);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.notificationService.markAsRead(
        req.params.notificationId,
        req.user!.userId,
      );
      res.status(200).json(successResponse({ message: 'Notification marked as read' }));
    } catch (error) {
      next(error);
    }
  };

  markAsUnread = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.notificationService.markAsUnread(
        req.params.notificationId,
        req.user!.userId,
      );
      res.status(200).json(successResponse({ message: 'Notification marked as unread' }));
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.notificationService.markAllAsRead(req.user!.userId);
      res.status(200).json(successResponse({ message: 'All notifications marked as read' }));
    } catch (error) {
      next(error);
    }
  };

  markBulkAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.notificationService.markBulkAsRead(req.body, req.user!.userId);
      res.status(200).json(successResponse({ message: 'Notifications marked as read' }));
    } catch (error) {
      next(error);
    }
  };
}
