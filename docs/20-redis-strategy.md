# Redis Strategy

## Purpose
Define the Redis usage across the platform including caching layers, session storage, rate limiting, Socket.IO adapter, and invalidation strategies.

## Redis Client Setup

```typescript
// config/redis.ts
import Redis from 'ioredis';

export const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
});

// Dedicated connection for BullMQ
export const bullRedis = new Redis({ /* same config */ });

// Dedicated connection for Socket.IO adapter (publish)
export const pubRedis = new Redis({ /* same config */ });

// Dedicated connection for Socket.IO adapter (subscribe)
export const subRedis = new Redis({ /* same config */ });
```

**Connection strategy**: Multiple dedicated connections instead of sharing one. BullMQ and Socket.IO require dedicated connections for their internal pub/sub mechanics. A shared client would cause event conflicts. The main `redisClient` handles all application-level operations (caching, rate limiting, session storage).

## Redis Usage Overview

| Purpose | Data Type | Key Pattern | TTL | Criticality |
|---------|-----------|-------------|-----|-------------|
| API cache | String (JSON) | cache:* | 30-300s | High |
| Rate limiting | Sorted Set | ratelimit:* | Window | High |
| Auth blacklist | Set | blacklist:* | Token TTL | High |
| Online presence | String | presence:user:* | 30s | Medium |
| BullMQ queues | Various | bull:* | - | High |
| Socket.IO | Pub/Sub | socket.io:* | - | High |
| Burndown data | Sorted Set | burndown:* | Sprint end | Low |
| Dashboard cache | String (JSON) | dashboard:* | 30s | Medium |
| Permission cache | String (JSON) | permissions:* | 300s | Medium |

## Caching Layers

### Layer 1: In-Memory (Node.js process)
Ultra-fast but per-process. Used for configuration and static lookups.

```typescript
// Simple in-memory cache with TTL for config values
const configCache = new Map<string, { value: unknown; expires: number }>();
export function getConfig<T>(key: string): T | null { /* check memory */ }
export function setConfig<T>(key: string, value: T, ttlMs: number): void { /* set memory + expiry */ }
```

### Layer 2: Redis (Shared)
Cross-process cache. Used for all shared cached data.

```typescript
// shared/cache/cache.service.ts
class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const raw = await redisClient.get(`cache:${key}`);
    return raw ? JSON.parse(raw) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await redisClient.setex(`cache:${key}`, ttlSeconds, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await redisClient.keys(`cache:${pattern}`);
    if (keys.length > 0) await redisClient.del(...keys);
  }

  async invalidateByPrefix(prefix: string): Promise<void> {
    // Invalidate all cache entries starting with prefix
    // Example: invalidateByPrefix('project:uuid') clears all project-related cache
    const keys = await redisClient.keys(`cache:project:${prefix}:*`);
    if (keys.length > 0) await redisClient.del(...keys);
  }
}
```

## Caching Strategy by Data Type

| Data | Key Pattern | TTL | Invalidation |
|------|-------------|-----|-------------|
| User permissions | permissions:user:<id> | 300s | On role change |
| Project task counts | project:<id>:task-counts | 30s | On task mutation |
| Workspace member list | workspace:<id>:members | 60s | On member change |
| Dashboard metrics | dashboard:project:<id> | 30s | Soft (set short TTL) |
| User list | users:search:<query> | 120s | On user create/update |
| Project list | workspace:<id>:projects | 60s | On project mutation |
| Sprint data | sprint:<id> | 60s | On sprint update |

**Cache-aside pattern**:
```typescript
async function getCachedOrFetch<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = await cacheService.get<T>(key);
  if (cached) return cached;

  const data = await fetcher();
  await cacheService.set(key, data, ttl);
  return data;
}
```

## Rate Limiting

**Algorithm**: Sliding window using Redis sorted sets. Each request adds a timestamp to the user's sorted set and removes entries outside the window.

```typescript
// shared/middleware/rate-limit.middleware.ts
async function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const key = `ratelimit:${req.ip}:${req.path}`;
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;
  const now = Date.now();

  // Remove old entries
  await redisClient.zremrangebyscore(key, 0, now - windowMs);

  // Count current entries
  const count = await redisClient.zcard(key);

  if (count >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many requests' }
    });
  }

  // Add current request
  await redisClient.zadd(key, now, `${now}-${Math.random()}`);
  await redisClient.expire(key, Math.ceil(windowMs / 1000));

  next();
}
```

**Rate limit tiers**:

| Tier | Limit | Window | Applied To |
|------|-------|--------|------------|
| Global | 1000 req/min | 1 minute | All authenticated API |
| Auth | 10 req/min | 1 minute | Login, register, forgot-password |
| Search | 60 req/min | 1 minute | Search endpoint |
| Upload | 30 req/min | 1 minute | File upload endpoint |
| Bulk | 10 req/min | 1 minute | Bulk operations |

## Session / Token Storage

**Auth token blacklist**: When a user logs out, their access token is added to Redis with TTL equal to remaining token expiry.

```typescript
const key = `blacklist:${tokenJti}`;
await redisClient.setex(key, remainingSeconds, '1');
```

**Refresh token tracking**: Not stored in Redis (stored in PostgreSQL). Only the access token blacklist uses Redis.

## Socket.IO Adapter

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
const pubClient = redisClient.duplicate();
const subClient = redisClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));
```

The adapter uses Redis pub/sub to broadcast messages across Socket.IO server instances. When one instance emits an event to a room, the adapter publishes it to Redis, all instances receive it, and forward to their connected clients in that room.

## Invalidation Strategy

### Explicit Invalidation
When a mutation occurs, invalidate related cache keys:

```typescript
// On task creation in project P:
await cacheService.invalidateByPrefix(`project:${projectId}`);
await cacheService.del(`dashboard:project:${projectId}`);
```

### Soft Invalidation (for high-frequency mutations)
Instead of deleting the cache key, set a very short TTL:

```typescript
// On task move on Kanban board:
await redisClient.expire(`cache:dashboard:project:${projectId}`, 5);
// Existing cached data serves requests for 5 more seconds
// Then the next request recomputes fresh data
```

This prevents a cache stampede when many requests hit immediately after a mutation.

### TTL-based Expiration
Default invalidation. Cache entries automatically expire based on their TTL. The application tolerates stale data up to the TTL duration.

## Key Naming Convention

```
<namespace>:<entity>:<id>[:<subresource>]
```

Examples:
- `cache:project:a1b2c3:task-counts`
- `ratelimit:auth:192.168.1.1`
- `blacklist:token-jti-abc`
- `presence:user:user-uuid`
- `presence:workspace:ws-uuid`
- `burndown:sprint-uuid:2025-03-01`
- `dashboard:project:proj-uuid`
- `permissions:user:user-uuid`

## Monitoring

```typescript
// Redis health check
async function checkRedisHealth(): Promise<boolean> {
  try {
    const result = await redisClient.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}
```

**Memory monitoring**: Set maxmemory policy to `allkeys-lru`. Monitor used_memory and evicted_keys in production. Alert if evictions exceed 100/sec.

## Design Decisions

- **Multiple Redis connections** - BullMQ and Socket.IO require dedicated connections for their pub/sub mechanics. Separate connections prevent cross-library event pollution.
- **Sorted sets for rate limiting** - More accurate than INCR-based counters. The sorted set can count requests in a sliding window, avoiding burst edge cases at window boundaries.
- **Cache-aside pattern** - Simple and predictable. The application explicitly manages cache population. No write-through or write-behind complexity.
- **Keyspace-level separation** - Using prefixes to separate cache, rate limit, presence, etc. in the same Redis instance. This keeps infrastructure simple for MVP. A separate Redis instance can be introduced for high-priority data (rate limiting, auth) in production.

## Future Considerations

- **Redis Cluster** - When the dataset exceeds a single instance's memory (16GB+), migrate to Redis Cluster with key hashing tags to keep related keys on the same node.
- **Read replicas** - Separate cache reads and writes. Redis replication for read-heavy workloads.
- **Dedicated Redis for BullMQ** - Move BullMQ to its own Redis instance to prevent queue processing from competing with API cache performance.
- **Redis Streams** - For event sourcing, Redis Streams provide an alternative to BullMQ for certain event-driven patterns.
