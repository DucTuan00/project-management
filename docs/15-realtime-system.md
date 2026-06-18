# Realtime System

## Purpose
Define the Socket.IO-based realtime system including connection management, authentication, room architecture, presence tracking, typing indicators, and realtime task updates.

## Architecture Overview

Socket.IO server runs on the same Express instance, sharing the HTTP server. Redis adapter enables cross-instance broadcasting using Redis pub/sub. Frontend uses a singleton Socket.IO client managed via React context.

## Connection Flow

1. Client connects after authentication (access token in handshake.auth.token)
2. Server validates JWT in middleware
3. Stores user data in socket.data.user
4. Client subscribes to rooms (workspace, project, task)
5. Server tracks presence in Redis

## Socket.IO Server Setup

```typescript
import { createAdapter } from '@socket.io/redis-adapter';

const io = new SocketIOServer(httpServer, {
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
  pingInterval: 25000,
  pingTimeout: 20000,
});

const pubClient = redisClient.duplicate();
const subClient = redisClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));
```

## Authentication Middleware

```typescript
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('AUTHENTICATION_REQUIRED'));
  try {
    const payload = verifyAccessToken(token);
    socket.data.user = await getUserPermissions(payload.sub);
    next();
  } catch {
    next(new Error('INVALID_TOKEN'));
  }
});
```

## Room Structure

| Room Pattern | Access Check | Purpose |
|-------------|-------------|---------|
| user:<userId> | Auto on connect | Personal notifications |
| workspace:<workspaceId> | Must be member | Workspace-level events |
| project:<projectId> | Must be project member | Task updates, board moves |
| task:<taskId> | Must have task access | Comments, status changes |

Clients emit join:workspace, join:project, leave:workspace, leave:project events. Server validates membership before joining rooms.

## Event Catalog

### Client to Server
| Event | Payload | Description |
|-------|---------|-------------|
| join:workspace | { workspaceId } | Join workspace room |
| leave:workspace | { workspaceId } | Leave workspace room |
| join:project | { projectId } | Join project room |
| leave:project | { projectId } | Leave project room |
| typing:start | { taskId } | User started typing |
| typing:stop | { taskId } | User stopped typing |

### Server to Client
| Event | Payload | Description |
|-------|---------|-------------|
| task:created | { task } | Task created |
| task:updated | { task, changes, actor } | Task updated |
| task:status-changed | { taskId, from, to, actor } | Task moved on board |
| comment:added | { comment, taskId } | New comment |
| notification:new | { notification } | New notification |
| sprint:started | { sprint } | Sprint activated |
| sprint:completed | { sprint } | Sprint completed |
| typing:indicator | { taskId, userId, displayName } | User typing |
| presence:online | { userId } | User came online |
| presence:offline | { userId } | User went offline |

## Presence Tracking

Redis key structure:
```
presence:user:<userId> -> socketId (String, TTL 30s, refreshed on heartbeat)
presence:workspace:<workspaceId> -> Set of userIds
```

On connect: add to presence set. On heartbeat: refresh TTL. On disconnect: remove, broadcast presence:offline.

Frontend tracks Set of online user IDs received via presence events. Shows green dot on avatar for online users in same workspace.

## Typing Indicators

Client emits typing:start with 2s debounce on input change, typing:stop after 3s inactivity. Server broadcasts to task:<taskId> room. Frontend shows "Jane is typing..." with 3s auto-hide timeout.

## Realtime Task Updates

After REST API mutation succeeds, controller emits to project:projectId room:
```typescript
io.to(`project:${projectId}`).emit('task:updated', {
  task, changes, actor: { id: userId, displayName }
});
```

Frontend ignores own events (already have optimistic update), updates TanStack Query cache for others, shows toast for status changes.

## Error Handling

| Error | Code | Action |
|-------|------|--------|
| Invalid token | INVALID_TOKEN | Disconnect, client reconnects with new token |
| Expired token | TOKEN_EXPIRED | Disconnect, client refreshes and reconnects |
| Forbidden room | FORBIDDEN | Socket stays connected, room join rejected |
| Rate limited | RATE_LIMITED | Event ignored, error emitted to client |

## Design Decisions

- **WebSocket-only transport** - Skip HTTP polling. All modern environments support WebSocket.
- **Redis adapter** - Required for horizontal scaling. Without it, messages broadcast on one process are lost to clients on another.
- **Room-based access control** - Authorization is enforced at room join. User cannot receive events for resources they lack access to.
- **Thin event payloads** - Events contain changed data + actor. Full state fetched via REST when needed.

## Performance

~20-50KB per connection. Plan for 500 concurrent connections per instance. Client-to-server events rate-limited to 10/s per socket. Broadcast batching for large-audience events.

## Future Considerations

- Socket.IO namespaces for channel isolation
- Event persistence via Redis streams for missed-event replay on reconnect
- Y.js CRDT integration for collaborative task description editing
- WebRTC signaling over existing Socket.IO infrastructure
