import { Router } from 'express';
import { AppDataSource } from '@/config/database';
import { NotificationRepository } from '@/modules/notification/notification.repository';
import { NotificationService } from '@/modules/notification/notification.service';
import { NotificationController } from '@/modules/notification/notification.controller';
import { validate } from '@/shared/middleware/validate.middleware';
import { authenticate } from '@/shared/middleware/auth.middleware';
import {
  listNotificationsSchema,
  markReadSchema,
} from '@/modules/notification/notification.dto';

const notificationRepository = new NotificationRepository(AppDataSource);
const notificationService = new NotificationService(notificationRepository);
const notificationController = new NotificationController(notificationService);

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// List notifications
router.get(
  '/',
  validate(listNotificationsSchema, 'query'),
  notificationController.listByUser,
);

// Get unread count
router.get(
  '/unread-count',
  notificationController.getUnreadCount,
);

// Mark all as read
router.post(
  '/read-all',
  notificationController.markAllAsRead,
);

// Bulk mark as read
router.post(
  '/read-bulk',
  validate(markReadSchema),
  notificationController.markBulkAsRead,
);

// Mark single as read
router.post(
  '/:notificationId/read',
  notificationController.markAsRead,
);

// Mark single as unread
router.post(
  '/:notificationId/unread',
  notificationController.markAsUnread,
);

export default router;
