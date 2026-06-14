import apiClient from '@/lib/api-client';
import { Notification } from './types';

export const notificationApi = {
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<{ data: Notification[]; pagination: any }> => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data.data;
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await apiClient.post(`/notifications/${notificationId}/read`);
  },

  markAsUnread: async (notificationId: string): Promise<void> => {
    await apiClient.post(`/notifications/${notificationId}/unread`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all');
  },

  markBulkAsRead: async (notificationIds?: string[]): Promise<void> => {
    await apiClient.post('/notifications/read-bulk', { notificationIds });
  },
};
