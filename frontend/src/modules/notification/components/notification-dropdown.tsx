'use client';

import React, { useState } from 'react';
import { Bell, Check, CheckCheck, MessageSquare, UserPlus, AlertCircle } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { Button } from '@/components/ui/button';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '../queries';
import { Notification } from '../types';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'comment.added':
    case 'comment.mention':
      return <MessageSquare style={{ fontSize: '16px', color: '#ff4f00' }} />;
    case 'task.assigned':
    case 'task.unassigned':
      return <UserPlus style={{ fontSize: '16px', color: '#16a34a' }} />;
    case 'task.status_changed':
    case 'task.due_soon':
    case 'task.overdue':
      return <AlertCircle style={{ fontSize: '16px', color: '#d97706' }} />;
    default:
      return <Bell style={{ fontSize: '16px', color: '#939084' }} />;
  }
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
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
    <ClickAwayListener onClickAway={() => setIsOpen(false)}>
      <Box sx={{ position: 'relative' }}>
        <Box
          component="button"
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            position: 'relative',
            borderRadius: '12px',
            p: 1,
            color: '#939084',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: '#f8f4f0',
              color: '#605d52',
            },
            transition: 'all 0.2s',
          }}
          title="Notifications"
        >
          <Bell style={{ fontSize: '20px' }} />
          {unreadCount > 0 && (
            <Box
              sx={{
                position: 'absolute',
                right: 4,
                top: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#dc2626',
                color: '#fffefb',
                fontSize: '10px',
                fontWeight: 500,
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Box>
          )}
        </Box>

        {isOpen && (
          <Paper
            elevation={0}
            sx={{
              position: 'absolute',
              right: 0,
              top: '100%',
              zIndex: 50,
              mt: 1,
              width: '384px',
              borderRadius: '12px',
              border: '1px solid #c5c0b1',
              backgroundColor: '#fffefb',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #c5c0b1',
                px: 2,
                py: 1.5,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#201515', fontSize: '14px' }}>
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </Typography>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  loading={markAllAsRead.isPending}
                >
                  <CheckCheck size={16} style={{ marginRight: '4px' }} />
                  Mark all read
                </Button>
              )}
            </Box>

            <Box sx={{ maxHeight: '384px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#939084', fontSize: '14px' }}>
                    No notifications
                  </Typography>
                </Box>
              ) : (
                notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))
              )}
            </Box>
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
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
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        borderBottom: '1px solid #f8f4f0',
        px: 2,
        py: 1.5,
        cursor: 'pointer',
        backgroundColor: !notification.isRead ? '#fff7ed' : 'transparent',
        '&:hover': {
          backgroundColor: '#f8f4f0',
        },
        transition: 'background-color 0.2s',
      }}
      onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
    >
      <Box sx={{ mt: 0.25 }}>{getNotificationIcon(notification.type)}</Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 500, color: '#201515', fontSize: '14px' }}>
          {notification.title}
        </Typography>
        {notification.body && (
          <Typography
            variant="caption"
            sx={{
              mt: 0.5,
              color: '#939084',
              fontSize: '12px',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {notification.body}
          </Typography>
        )}
        <Typography variant="caption" sx={{ mt: 0.5, color: '#c5c0b1', fontSize: '12px', display: 'block' }}>
          {formatDate(notification.createdAt)}
        </Typography>
      </Box>

      {!notification.isRead && (
        <Box sx={{ mt: 0.5 }}>
          <Box
            sx={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#ff4f00',
            }}
          />
        </Box>
      )}
    </Box>
  );
}
