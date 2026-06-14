import { Socket } from 'socket.io';

export interface SocketUser {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface AuthenticatedSocket extends Socket {
  data: {
    user: SocketUser;
  };
}

// Client to Server events
export interface ClientToServerEvents {
  'join:workspace': (data: { workspaceId: string }) => void;
  'leave:workspace': (data: { workspaceId: string }) => void;
  'join:project': (data: { projectId: string }) => void;
  'leave:project': (data: { projectId: string }) => void;
  'typing:start': (data: { taskId: string }) => void;
  'typing:stop': (data: { taskId: string }) => void;
}

// Server to Client events
export interface ServerToClientEvents {
  'task:created': (data: { task: any }) => void;
  'task:updated': (data: { task: any; changes: any; actor: SocketUser }) => void;
  'task:status-changed': (data: { taskId: string; from: string; to: string; actor: SocketUser }) => void;
  'comment:added': (data: { comment: any; taskId: string }) => void;
  'notification:new': (data: { notification: any }) => void;
  'sprint:started': (data: { sprint: any }) => void;
  'sprint:completed': (data: { sprint: any }) => void;
  'typing:indicator': (data: { taskId: string; userId: string; displayName: string }) => void;
  'presence:online': (data: { userId: string }) => void;
  'presence:offline': (data: { userId: string }) => void;
  'error': (data: { code: string; message: string }) => void;
}

// Room patterns
export const ROOMS = {
  USER: (userId: string) => `user:${userId}`,
  WORKSPACE: (workspaceId: string) => `workspace:${workspaceId}`,
  PROJECT: (projectId: string) => `project:${projectId}`,
  TASK: (taskId: string) => `task:${taskId}`,
} as const;

// Event names
export const SOCKET_EVENTS = {
  // Client to Server
  JOIN_WORKSPACE: 'join:workspace',
  LEAVE_WORKSPACE: 'leave:workspace',
  JOIN_PROJECT: 'join:project',
  LEAVE_PROJECT: 'leave:project',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  // Server to Client
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_STATUS_CHANGED: 'task:status-changed',
  COMMENT_ADDED: 'comment:added',
  NOTIFICATION_NEW: 'notification:new',
  SPRINT_STARTED: 'sprint:started',
  SPRINT_COMPLETED: 'sprint:completed',
  TYPING_INDICATOR: 'typing:indicator',
  PRESENCE_ONLINE: 'presence:online',
  PRESENCE_OFFLINE: 'presence:offline',
  ERROR: 'error',
} as const;
