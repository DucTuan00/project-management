import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from './api';

export function useNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationApi.getNotifications(params),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAsUnread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationApi.markAsUnread(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
