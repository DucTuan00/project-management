import { NotificationRepository } from '@/modules/notification/notification.repository';
import {
  ListNotificationsQuery,
  MarkReadDto,
} from '@/modules/notification/notification.dto';
import {
  NotificationResponse,
  toNotificationResponse,
} from '@/modules/notification/notification.types';
import { createPaginatedResponse, PaginatedResult } from '@/shared/dto/pagination.dto';
import { logger } from '@/shared/logger/logger';

export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async listByUser(
    userId: string,
    query: ListNotificationsQuery,
  ): Promise<PaginatedResult<NotificationResponse>> {
    const { notifications, total } = await this.notificationRepository.findByUserId(userId, {
      page: query.page,
      limit: query.limit,
      unreadOnly: query.unreadOnly,
    });

    const data = notifications.map(toNotificationResponse);

    return createPaginatedResponse(data, total, query.page, query.limit);
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.getUnreadCount(userId);
    return { count };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification || notification.userId !== userId) {
      return; // Silently ignore if not found or not owned
    }

    await this.notificationRepository.markAsRead(notificationId);

    logger.info({ notificationId, userId }, 'Notification marked as read');
  }

  async markAsUnread(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification || notification.userId !== userId) {
      return;
    }

    await this.notificationRepository.markAsUnread(notificationId);

    logger.info({ notificationId, userId }, 'Notification marked as unread');
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);

    logger.info({ userId }, 'All notifications marked as read');
  }

  async markBulkAsRead(dto: MarkReadDto, userId: string): Promise<void> {
    if (dto.notificationIds && dto.notificationIds.length > 0) {
      await this.notificationRepository.markBulkAsRead(dto.notificationIds);
    } else {
      await this.notificationRepository.markAllAsRead(userId);
    }

    logger.info({ userId, count: dto.notificationIds?.length }, 'Bulk notifications marked as read');
  }

  // Helper method to create notifications from events
  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    data?: Record<string, any>;
  }): Promise<NotificationResponse> {
    const notification = await this.notificationRepository.create(data);
    return toNotificationResponse(notification);
  }

  // Helper method to create bulk notifications
  async createBulkNotifications(
    notifications: Array<{
      userId: string;
      type: string;
      title: string;
      body?: string;
      data?: Record<string, any>;
    }>,
  ): Promise<NotificationResponse[]> {
    const created = await this.notificationRepository.createBulk(notifications);
    return created.map(toNotificationResponse);
  }
}
