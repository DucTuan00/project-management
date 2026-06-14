import { io, Socket } from 'socket.io-client';

// Server to Client events
interface ServerToClientEvents {
  'task:created': (data: { task: any }) => void;
  'task:updated': (data: { task: any; changes: any; actor: any }) => void;
  'task:status-changed': (data: { taskId: string; from: string; to: string; actor: any }) => void;
  'comment:added': (data: { comment: any; taskId: string }) => void;
  'notification:new': (data: { notification: any }) => void;
  'sprint:started': (data: { sprint: any }) => void;
  'sprint:completed': (data: { sprint: any }) => void;
  'typing:indicator': (data: { taskId: string; userId: string; displayName: string }) => void;
  'presence:online': (data: { userId: string }) => void;
  'presence:offline': (data: { userId: string }) => void;
  'error': (data: { code: string; message: string }) => void;
}

// Client to Server events
interface ClientToServerEvents {
  'join:workspace': (data: { workspaceId: string }) => void;
  'leave:workspace': (data: { workspaceId: string }) => void;
  'join:project': (data: { projectId: string }) => void;
  'leave:project': (data: { projectId: string }) => void;
  'typing:start': (data: { taskId: string }) => void;
  'typing:stop': (data: { taskId: string }) => void;
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export function getSocket(): AppSocket {
  if (!socket) {
    const token = localStorage.getItem('accessToken');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    socket = io(apiUrl, {
      auth: {
        token,
      },
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }

  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function updateSocketToken(): void {
  const token = localStorage.getItem('accessToken');
  if (socket) {
    socket.auth = { token };
    if (socket.connected) {
      socket.disconnect();
      socket.connect();
    }
  }
}
