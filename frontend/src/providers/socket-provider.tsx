'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppSocket, getSocket, connectSocket, disconnectSocket } from '@/lib/socket-client';
import { useAuth } from '@/providers/auth-provider';

interface SocketContextType {
  socket: AppSocket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  joinWorkspace: (workspaceId: string) => void;
  leaveWorkspace: (workspaceId: string) => void;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  startTyping: (taskId: string) => void;
  stopTyping: (taskId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const s = getSocket();

    // Connection events
    s.on('connect', () => {
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    // Presence events
    s.on('presence:online', (data) => {
      setOnlineUsers((prev) => new Set([...prev, data.userId]));
    });

    s.on('presence:offline', (data) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    });

    // Realtime task updates
    s.on('task:created', (data) => {
      // Invalidate project tasks query
      if (data.task?.projectId) {
        queryClient.invalidateQueries({
          queryKey: ['project', data.task.projectId, 'tasks'],
        });
        queryClient.invalidateQueries({
          queryKey: ['project', data.task.projectId, 'board'],
        });
      }
    });

    s.on('task:updated', (data) => {
      if (data.task?.projectId) {
        queryClient.invalidateQueries({
          queryKey: ['project', data.task.projectId, 'tasks'],
        });
        queryClient.invalidateQueries({
          queryKey: ['project', data.task.projectId, 'board'],
        });
      }
      if (data.task?.id) {
        queryClient.invalidateQueries({
          queryKey: ['task', data.task.id],
        });
      }
    });

    s.on('task:status-changed', (data) => {
      queryClient.invalidateQueries({
        queryKey: ['task', data.taskId],
      });
    });

    // Comment events
    s.on('comment:added', (data) => {
      queryClient.invalidateQueries({
        queryKey: ['task', data.taskId, 'comments'],
      });
    });

    // Notification events
    s.on('notification:new', (data) => {
      queryClient.invalidateQueries({
        queryKey: ['notifications'],
      });
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'unread-count'],
      });
    });

    setSocket(s);
    connectSocket();

    return () => {
      s.off('connect');
      s.off('disconnect');
      s.off('connect_error');
      s.off('presence:online');
      s.off('presence:offline');
      s.off('task:created');
      s.off('task:updated');
      s.off('task:status-changed');
      s.off('comment:added');
      s.off('notification:new');
    };
  }, [isAuthenticated, queryClient]);

  const joinWorkspace = useCallback((workspaceId: string) => {
    socket?.emit('join:workspace', { workspaceId });
  }, [socket]);

  const leaveWorkspace = useCallback((workspaceId: string) => {
    socket?.emit('leave:workspace', { workspaceId });
  }, [socket]);

  const joinProject = useCallback((projectId: string) => {
    socket?.emit('join:project', { projectId });
  }, [socket]);

  const leaveProject = useCallback((projectId: string) => {
    socket?.emit('leave:project', { projectId });
  }, [socket]);

  const startTyping = useCallback((taskId: string) => {
    socket?.emit('typing:start', { taskId });
  }, [socket]);

  const stopTyping = useCallback((taskId: string) => {
    socket?.emit('typing:stop', { taskId });
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        joinWorkspace,
        leaveWorkspace,
        joinProject,
        leaveProject,
        startTyping,
        stopTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
