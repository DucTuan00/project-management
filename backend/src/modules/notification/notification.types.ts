import { Notification } from '@/modules/notification/notification.entity';

export interface NotificationResponse {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, any>;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export function toNotificationResponse(notification: Notification): NotificationResponse {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    isRead: notification.isRead,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  };
}

// Notification types
export const NotificationTypes = {
  TASK_ASSIGNED: 'task.assigned',
  TASK_UNASSIGNED: 'task.unassigned',
  TASK_STATUS_CHANGED: 'task.status_changed',
  TASK_DUE_SOON: 'task.due_soon',
  TASK_OVERDUE: 'task.overdue',
  COMMENT_ADDED: 'comment.added',
  COMMENT_MENTION: 'comment.mention',
  SPRINT_STARTED: 'sprint.started',
  SPRINT_COMPLETED: 'sprint.completed',
  MEMBER_JOINED: 'member.joined',
  MEMBER_REMOVED: 'member.removed',
} as const;
