# DevOps & Deployment

## Purpose
Define the Docker architecture, container structure, environment management, production deployment topology, scaling strategy, and monitoring approach.

## Docker Architecture

```
┌───────────────────────────────────────────────────┐
│                   Nginx (Reverse Proxy)            │
│                     Port 80 / 443                  │
└──────────────────────┬────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌─────────────────┐ ┌──────┐ ┌──────────┐
│  Next.js App    │ │ API  │ │  Admin   │
│  (Frontend)     │ │(Express)│ │  Panel  │ (future)
│  Port 3000      │ │Port 5000│ │          │
└────────┬────────┘ └──┬────┘ └──────────┘
         │              │
         │    ┌─────────┼──────────┐
         │    ▼         ▼          ▼
         │ ┌──────┐ ┌──────┐ ┌──────────┐
         │ │PostgreSQL│ │Redis │ │  S3/MinIO │
         │ │ Port 5432│ │Port 6379│ │  (storage)│
         │ └──────┘ └──────┘ └──────────┘
         │
         ▼
┌──────────────────┐
│  NGINX (Static)  │
│  /uploads/*       │
└──────────────────┘
```

## Container Structure

```yaml
# docker-compose.yml (production)
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./docker/nginx/sites:/etc/nginx/sites-enabled
      - static_volume:/static
    depends_on: [frontend, backend]

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    expose: ["3000"]
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.pmplatform.com/api/v1
      - NEXT_PUBLIC_SOCKET_URL=https://api.pmplatform.com
    env_file: .env

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    expose: ["5000"]
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@postgres:5432/pmplatform
      - REDIS_URL=redis://:password@redis:6379
      - STORAGE_TYPE=s3
    env_file: .env
    depends_on: [postgres, redis]
    volumes:
      - static_volume:/app/uploads

  postgres:
    image: postgres:16-alpine
    expose: ["5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      - POSTGRES_DB=pmplatform
      - POSTGRES_USER=pmplatform
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pmplatform"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    expose: ["6379"]
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
  redisdata:
  static_volume:
```

## Dockerfile

### Backend Dockerfile
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup --system app && adduser --system --ingroup app app
COPY --from=build /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
USER app
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

### Frontend Dockerfile
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
RUN npm run build

# Stage 3: Production (standalone output)
FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup --system app && adduser --system --ingroup app app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER app
EXPOSE 3000
CMD ["node", "server.js"]
```

## Nginx Configuration

```nginx
# docker/nginx/nginx.conf
upstream frontend {
    server frontend:3000;
}

upstream backend {
    server backend:5000;
}

server {
    listen 80;
    server_name pmplatform.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pmplatform.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;

    # API
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
    }

    # File uploads
    location /uploads/ {
        alias /static/uploads/;
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Environment Strategy

| Environment | Purpose | Configuration Source |
|-------------|---------|---------------------|
| development | Local development | .env file in each service |
| staging | Pre-production testing | CI/CD environment variables |
| production | Live platform | Docker secrets / AWS Secrets Manager |

### Environment File Template

```bash
# .env.example (root)
NODE_ENV=development

# Database
DATABASE_URL=postgresql://pmplatform:password@postgres:5432/pmplatform

# Redis
REDIS_URL=redis://:password@redis:6379

# JWT
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Frontend
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Email (SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key

# Storage
STORAGE_TYPE=local

# Redis Cache TTLs (seconds)
CACHE_TTL_DEFAULT=60
CACHE_TTL_DASHBOARD=30
CACHE_TTL_PERMISSIONS=300
```

## Production Deployment

### Single-Server (MVP)

For moderate load (< 500 concurrent users), a single server with Docker Compose is sufficient:

- 4 CPU, 8GB RAM minimum
- Docker Compose with all services
- Nginx as reverse proxy
- Let's Encrypt SSL via Certbot
- Daily database backups to S3

### Multi-Server (Scaling)

For higher load, separate services onto dedicated instances:

```
Load Balancer (Nginx / ALB)
    |
    +---- API Server 1    + PostgreSQL Primary
    +---- API Server 2    + Redis
    +---- API Server N    + PostgreSQL Replica (read)
    |
    Frontend (CDN)
```

## Deployment Flow

1. CI passes (tests, lint, build)
2. Docker image built and pushed to container registry (Docker Hub / ECR)
3. Compose file pulled onto server
4. `docker compose pull` then `docker compose up -d` (rolling update)
5. Health check verified
6. Old containers removed

## Scaling Strategy

### Horizontal Scaling (API)
- Add more backend containers behind load balancer
- Socket.IO scaling via Redis adapter
- Session affinity NOT required (JWT-based auth)

### Vertical Scaling (Database)
- PostgreSQL: increase instance size, add indexes
- Read replica for analytics queries (future)
- Connection pooling via PgBouncer (future)

### Caching
- Redis cache for frequent reads (dashboard, permissions)
- CDN for static assets (frontend build, uploaded images)
- Browser caching for API responses via Cache-Control headers

## Monitoring Strategy

### Health Checks

Each service has a `/health` endpoint:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:00:00Z",
  "services": {
    "database": { "status": "healthy", "latencyMs": 3 },
    "redis": { "status": "healthy", "latencyMs": 1 },
    "storage": { "status": "healthy" }
  },
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Key Metrics

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| API response time (p95) | Application logs | > 500ms |
| Error rate | Application logs | > 1% of requests |
| CPU usage | Docker stats | > 80% for 5 min |
| Memory usage | Docker stats | > 85% |
| DB connections | PostgreSQL | > 80% of max |
| Redis memory | Redis INFO | > 70% of max |
| Disk usage | Docker stats | > 85% |
| 5xx rate | Nginx logs | > 0.1% of requests |

### Logging

- **Structured JSON logging** via Pino
- Logs written to stdout (Docker captures them)
- Future: Ship to ELK stack or DataDog
- Log retention: 30 days in production

### Backup Strategy

| Backup | Frequency | Retention | Storage |
|--------|-----------|-----------|---------|
| PostgreSQL dump | Daily | 30 days | S3 |
| Database WAL | Continuous | 7 days | Local |
| Uploaded files | Included in DB backup | 30 days | S3 |
| Config files | Version controlled | Indefinite | Git |

**Restore test**: Automated monthly restore test to staging environment verifies backup integrity.

## Design Decisions

- **Single Docker Compose for MVP** - Simplifies deployment. No Kubernetes overhead. Easy to migrate to orchestration later.
- **Nginx over Traefik** - More familiar to ops teams, simpler configuration for Socket.IO proxying, better performance.
- **Standalone Next.js output** - Multi-stage Docker build with standalone output minimizes production image size.
- **Database connection string in env** - Simple for MVP. Production uses AWS RDS IAM auth or similar.
- **Non-root containers** - Reduces blast radius of container compromise. Files are written to volumes, not container layer.

## Future Considerations

- **Kubernetes** - When scaling beyond single-server, migrate to EKS/GKE. Docker Compose file converts to K8s manifests with Kompose.
- **Blue-green deployment** - Zero-downtime deployments with traffic switching. Requires load balancer.
- **Auto-scaling** - Horizontal Pod Autoscaler based on CPU/memory/request count.
- **Service mesh** - Istio or Linkerd for traffic management, observability, and mTLS between services.
- **GitOps** - ArgoCD for declarative deployments from Git repository.
- **APM** - Application Performance Monitoring with DataDog or New Relic for distributed tracing.
