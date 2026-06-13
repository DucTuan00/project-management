import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '@/config/redis';
import { env } from '@/config/env';

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
  message?: string;
}

const defaultOptions: Required<RateLimitOptions> = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  keyPrefix: 'ratelimit:',
  message: 'Too many requests, please try again later',
};

export function rateLimit(options: RateLimitOptions = {}) {
  const config = { ...defaultOptions, ...options };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const redis = getRedisClient();
      const key = `${config.keyPrefix}${req.ip || req.socket.remoteAddress}`;
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Remove old entries
      await redis.zremrangebyscore(key, 0, windowStart);

      // Count current requests
      const count = await redis.zcard(key);

      if (count >= config.max) {
        const ttl = await redis.ttl(key);
        res.setHeader('X-RateLimit-Limit', config.max);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.ceil((now + (ttl || config.windowMs)) / 1000));
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: config.message,
          },
        });
        return;
      }

      // Add current request
      await redis.zadd(key, now.toString(), `${now}-${Math.random()}`);
      await redis.expire(key, Math.ceil(config.windowMs / 1000));

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.max);
      res.setHeader('X-RateLimit-Remaining', config.max - count - 1);
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + config.windowMs) / 1000));

      next();
    } catch (error) {
      // If Redis is down, allow the request through
      next();
    }
  };
}

// Preset rate limiters
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  keyPrefix: 'ratelimit:auth:',
  message: 'Too many authentication attempts, please try again later',
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  keyPrefix: 'ratelimit:api:',
  message: 'Too many API requests, please try again later',
});

export const strictRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyPrefix: 'ratelimit:strict:',
  message: 'Too many requests, account temporarily rate limited',
});
