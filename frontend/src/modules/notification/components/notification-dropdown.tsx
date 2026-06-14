'use client';

import React from 'react';
import { Bell, Check, CheckCheck, MessageSquare, UserPlus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '../queries';
import { Notification } from '../types';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'comment.added':
    case 'comment.mention':
      return <MessageSquare className="h-4 w-4 text-primary-500" />;
    case 'task.assigned':
    case 'task.unassigned':
      return <UserPlus className="h-4 w-4 text-success-500" />;
    case 'task.status_changed':
    case 'task.due_soon':
    case 'task.overdue':
      return <AlertCircle className="h-4 w-4 text-warning-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

export function NotificationDropdown() {
  const { data: unreadCountData } = useUnreadCount();
  const { data: notificationsData } = useNotifications({ limit: 10 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = unreadCountData?.count || 0;
  const notifications = notificationsData?.data || [];

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead.mutateAsync(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <div className="relative">
      <button
        className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-medium text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}

export function NotificationPanel() {
  const { data: notificationsData, isLoading } = useNotifications({ limit: 20 });
  const { data: unreadCountData } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = notificationsData?.data || [];
  const unreadCount = unreadCountData?.count || 0;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead.mutateAsync(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            loading={markAllAsRead.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
            />
          ))
        )}
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 border-b border-gray-100 px-4 py-3 hover:bg-gray-50',
        !notification.isRead && 'bg-primary-50'
      )}
      onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
    >
      <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
        {notification.body && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{notification.body}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">{formatDate(notification.createdAt)}</p>
      </div>

      {!notification.isRead && (
        <div className="mt-1">
          <span className="h-2 w-2 rounded-full bg-primary-500" />
        </div>
      )}
    </div>
  );
}
