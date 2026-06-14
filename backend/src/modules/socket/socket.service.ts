import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { logger } from '@/shared/logger/logger';
import {
  AuthenticatedSocket,
  ClientToServerEvents,
  ServerToClientEvents,
  ROOMS,
  SOCKET_EVENTS,
} from '@/modules/socket/socket.types';
import { AuthRepository } from '@/modules/auth/auth.repository';

// Presence TTL in seconds
const PRESENCE_TTL = 30;
const PRESENCE_KEY = 'presence:user:';
const PRESENCE_SET_KEY = 'presence:online';

export class SocketService {
  private io: SocketIOServer | null = null;
  private pubClient: Redis | null = null;
  private subClient: Redis | null = null;
  private userRepository: AuthRepository | null = null;
  private presenceTimers: Map<string, NodeJS.Timeout> = new Map();

  initialize(httpServer: HttpServer, userRepository: AuthRepository): void {
    this.userRepository = userRepository;

    // Create Socket.IO server
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: env.CORS_ORIGIN,
        credentials: true,
        methods: ['GET', 'POST'],
      },
      pingInterval: 25000,
      pingTimeout: 20000,
      transports: ['websocket'],
    });

    // Set up Redis adapter for horizontal scaling
    this.setupRedisAdapter();

    // Set up authentication middleware
    this.setupAuthMiddleware();

    // Set up connection handler
    this.setupConnectionHandler();

    logger.info('Socket.IO server initialized');
  }

  private async setupRedisAdapter(): Promise<void> {
    try {
      this.pubClient = new Redis({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD || undefined,
        db: env.REDIS_DB,
      });

      this.subClient = this.pubClient.duplicate();

      this.io!.adapter(createAdapter(this.pubClient, this.subClient));
      logger.info('Socket.IO Redis adapter configured');
    } catch (error) {
      logger.error({ err: error }, 'Failed to set up Redis adapter for Socket.IO');
      // Continue without Redis adapter (single instance mode)
    }
  }

  private setupAuthMiddleware(): void {
    this.io!.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('AUTHENTICATION_REQUIRED'));
        }

        const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; email: string };
        if (!payload || !payload.sub) {
          return next(new Error('INVALID_TOKEN'));
        }

        // Get user from database
        if (this.userRepository) {
          const user = await this.userRepository.findById(payload.sub);
          if (!user) {
            return next(new Error('USER_NOT_FOUND'));
          }

          socket.data.user = {
            userId: user.id,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
          };
        } else {
          socket.data.user = {
            userId: payload.sub,
            email: '',
            displayName: '',
            avatarUrl: null,
          };
        }

        next();
      } catch (error) {
        next(new Error('INVALID_TOKEN'));
      }
    });
  }

  private setupConnectionHandler(): void {
    this.io!.on('connection', (socket: AuthenticatedSocket) => {
      const { userId, displayName } = socket.data.user;
      logger.info({ userId, socketId: socket.id }, 'Socket connected');

      // Join personal room for notifications
      socket.join(ROOMS.USER(userId));

      // Track presence
      this.handlePresenceConnect(userId, socket.id);

      // Handle room joining
      socket.on(SOCKET_EVENTS.JOIN_WORKSPACE, async (data) => {
        try {
          // In production, verify membership here
          socket.join(ROOMS.WORKSPACE(data.workspaceId));
          logger.debug({ userId, workspaceId: data.workspaceId }, 'Joined workspace room');
        } catch (error) {
          socket.emit(SOCKET_EVENTS.ERROR, { code: 'FORBIDDEN', message: 'Access denied' });
        }
      });

      socket.on(SOCKET_EVENTS.LEAVE_WORKSPACE, (data) => {
        socket.leave(ROOMS.WORKSPACE(data.workspaceId));
        logger.debug({ userId, workspaceId: data.workspaceId }, 'Left workspace room');
      });

      socket.on(SOCKET_EVENTS.JOIN_PROJECT, async (data) => {
        try {
          // In production, verify membership here
          socket.join(ROOMS.PROJECT(data.projectId));
          logger.debug({ userId, projectId: data.projectId }, 'Joined project room');
        } catch (error) {
          socket.emit(SOCKET_EVENTS.ERROR, { code: 'FORBIDDEN', message: 'Access denied' });
        }
      });

      socket.on(SOCKET_EVENTS.LEAVE_PROJECT, (data) => {
        socket.leave(ROOMS.PROJECT(data.projectId));
        logger.debug({ userId, projectId: data.projectId }, 'Left project room');
      });

      // Handle typing indicators
      socket.on(SOCKET_EVENTS.TYPING_START, (data) => {
        socket.to(ROOMS.TASK(data.taskId)).emit(SOCKET_EVENTS.TYPING_INDICATOR, {
          taskId: data.taskId,
          userId,
          displayName,
        });
      });

      socket.on(SOCKET_EVENTS.TYPING_STOP, (data) => {
        socket.to(ROOMS.TASK(data.taskId)).emit(SOCKET_EVENTS.TYPING_INDICATOR, {
          taskId: data.taskId,
          userId,
          displayName: '', // Empty string means stopped typing
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info({ userId, socketId: socket.id }, 'Socket disconnected');
        this.handlePresenceDisconnect(userId, socket.id);
      });
    });
  }

  private handlePresenceConnect(userId: string, socketId: string): void {
    // Add to presence set
    if (this.pubClient) {
      this.pubClient.sadd(PRESENCE_SET_KEY, userId);
      this.pubClient.set(`${PRESENCE_KEY}${userId}`, socketId, 'EX', PRESENCE_TTL);
    }

    // Broadcast online status
    this.io?.emit(SOCKET_EVENTS.PRESENCE_ONLINE, { userId });

    // Clear existing timer
    const existingTimer = this.presenceTimers.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
  }

  private handlePresenceDisconnect(userId: string, socketId: string): void {
    // Check if user has other sockets
    const sockets = this.io?.sockets.sockets;
    let hasOtherSockets = false;

    if (sockets) {
      for (const [, socket] of sockets) {
        const authSocket = socket as AuthenticatedSocket;
        if (authSocket.data.user?.userId === userId && authSocket.id !== socketId) {
          hasOtherSockets = true;
          break;
        }
      }
    }

    if (!hasOtherSockets) {
      // Remove from presence set after delay (for reconnections)
      const timer = setTimeout(() => {
        if (this.pubClient) {
          this.pubClient.srem(PRESENCE_SET_KEY, userId);
          this.pubClient.del(`${PRESENCE_KEY}${userId}`);
        }
        this.io?.emit(SOCKET_EVENTS.PRESENCE_OFFLINE, { userId });
      }, 5000);

      this.presenceTimers.set(userId, timer);
    }
  }

  // Public methods for emitting events from controllers

  emitToProject(projectId: string, event: string, data: any): void {
    this.io?.to(ROOMS.PROJECT(projectId)).emit(event as any, data);
  }

  emitToTask(taskId: string, event: string, data: any): void {
    this.io?.to(ROOMS.TASK(taskId)).emit(event as any, data);
  }

  emitToUser(userId: string, event: string, data: any): void {
    this.io?.to(ROOMS.USER(userId)).emit(event as any, data);
  }

  emitToWorkspace(workspaceId: string, event: string, data: any): void {
    this.io?.to(ROOMS.WORKSPACE(workspaceId)).emit(event as any, data);
  }

  broadcastPresence(userId: string, online: boolean): void {
    const event = online ? SOCKET_EVENTS.PRESENCE_ONLINE : SOCKET_EVENTS.PRESENCE_OFFLINE;
    this.io?.emit(event, { userId });
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }

  async shutdown(): Promise<void> {
    // Clear all presence timers
    for (const timer of this.presenceTimers.values()) {
      clearTimeout(timer);
    }
    this.presenceTimers.clear();

    // Disconnect all sockets
    this.io?.disconnectSockets(true);

    // Close Redis connections
    if (this.pubClient) {
      await this.pubClient.quit();
    }
    if (this.subClient) {
      await this.subClient.quit();
    }

    // Close Socket.IO server
    this.io?.close();

    logger.info('Socket.IO server shut down');
  }
}

export const socketService = new SocketService();
