import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from '@/config/env';
import { errorHandler } from '@/shared/middleware/error.middleware';
import { apiRateLimit } from '@/shared/middleware/rate-limit.middleware';
import { logger } from '@/shared/logger/logger';

// Module imports
import authModule from '@/modules/auth/auth.module';
import workspaceModule from '@/modules/workspace/workspace.module';
import projectModule from '@/modules/project/project.module';
import taskModule from '@/modules/task/task.module';
import kanbanModule from '@/modules/kanban/kanban.module';
import commentModule from '@/modules/comment/comment.module';
import attachmentModule from '@/modules/attachment/attachment.module';
import notificationModule from '@/modules/notification/notification.module';

export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req: Request, _res: Response, next) => {
    logger.info({
      method: req.method,
      url: req.url,
      ip: req.ip,
    }, 'Incoming request');
    next();
  });

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API rate limiting
  app.use(env.API_PREFIX, apiRateLimit);

  // Routes
  app.use(`${env.API_PREFIX}/auth`, authModule);
  app.use(`${env.API_PREFIX}/workspaces`, workspaceModule);
  app.use(`${env.API_PREFIX}/projects`, projectModule);
  app.use(`${env.API_PREFIX}/tasks`, taskModule);
  app.use(env.API_PREFIX, kanbanModule);
  app.use(env.API_PREFIX, commentModule);
  app.use(env.API_PREFIX, attachmentModule);
  app.use(`${env.API_PREFIX}/notifications`, notificationModule);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}
