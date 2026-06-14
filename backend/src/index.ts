import 'reflect-metadata';
import { AppDataSource } from '@/config/database';
import { createRedisConnection, closeRedisConnection } from '@/config/redis';
import { createApp } from '@/app';
import { env } from '@/config/env';
import { logger } from '@/shared/logger/logger';
import { socketService } from '@/modules/socket/socket.service';
import { AuthRepository } from '@/modules/auth/auth.repository';

async function bootstrap(): Promise<void> {
  try {
    // Initialize database connection
    logger.info('Initializing database connection...');
    await AppDataSource.initialize();
    logger.info('Database connection established');

    // Run migrations
    logger.info('Running migrations...');
    await AppDataSource.runMigrations();
    logger.info('Migrations completed');

    // Initialize Redis
    logger.info('Initializing Redis connection...');
    createRedisConnection();
    logger.info('Redis connection initialized');

    // Create and start Express app
    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`API available at http://localhost:${env.PORT}${env.API_PREFIX}`);
    });

    // Initialize Socket.IO
    logger.info('Initializing Socket.IO...');
    const userRepository = new AuthRepository(AppDataSource);
    socketService.initialize(server, userRepository);
    logger.info('Socket.IO initialized');

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      // Shutdown Socket.IO first
      try {
        await socketService.shutdown();
        logger.info('Socket.IO server closed');
      } catch (err) {
        logger.error({ err }, 'Error closing Socket.IO server');
      }

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await AppDataSource.destroy();
          logger.info('Database connection closed');
        } catch (err) {
          logger.error({ err }, 'Error closing database connection');
        }

        try {
          await closeRedisConnection();
          logger.info('Redis connection closed');
        } catch (err) {
          logger.error({ err }, 'Error closing Redis connection');
        }

        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled errors
    process.on('unhandledRejection', (reason, promise) => {
      logger.error({ reason, promise }, 'Unhandled Rejection');
    });

    process.on('uncaughtException', (error) => {
      logger.error({ err: error }, 'Uncaught Exception');
      process.exit(1);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();
