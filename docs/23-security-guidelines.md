# Security Guidelines

## Purpose
Define security practices covering OWASP Top 10 considerations, input validation, authentication security, secrets management, and operational security for the platform.

## OWASP Top 10 Coverage

### A1: Broken Access Control

**Mitigations**:
- RBAC enforced at every route via middleware
- Resource ownership checks in service layer
- No IDOR vulnerabilities: UUIDs are used but access is still verified - never assume UUID obscurity is sufficient
- Workspace and project membership verified on every cross-resource operation
- Soft-delete prevents data recovery by unauthorized users

**Testing**:
- Every endpoint must have a negative test verifying a user without the required permission receives 403
- Cross-workspace access attempts (testing that workspace A's user cannot access workspace B's data)

### A2: Cryptographic Failures

**Mitigations**:
- Passwords hashed with bcrypt (12 rounds), never stored in plaintext
- JWT signed with HS256 using strong secrets (64+ character random strings)
- HTTPS enforced in production (redirect HTTP to HTTPS)
- All cookies use Secure, HttpOnly, SameSite=Strict flags
- Refresh tokens are opaque random strings, not JWTs
- Encryption at rest for database (RDS/Aurora encryption)
- Secrets never hardcoded - always environment variables or secrets manager

### A3: Injection

**Mitigations**:
- **SQL Injection**: TypeORM parameterized queries prevent SQL injection. Never use raw SQL with string concatenation. If raw queries are necessary, use TypeORM's parameterized query API (`SELECT * FROM tasks WHERE id = :id`, { id: taskId }).
- **NoSQL Injection**: Not applicable (PostgreSQL only).
- **Command Injection**: Never pass user input to shell commands. If file processing is needed, use dedicated libraries (sharp for images, pdf-parse for PDFs).
- **XSS**: See A7 below.

### A4: Insecure Design

**Mitigations**:
- Rate limiting on all public endpoints
- No email enumeration on login/forgot-password
- Input validation at controller boundary (Zod schemas reject unexpected fields)
- Business logic validation in service layer (status transitions, WIP limits)
- Secure defaults: all access is denied until explicitly granted

### A5: Security Misconfiguration

**Mitigations**:
- CORS restricted to specific frontend origin(s), not wildcard
- Helmet.js middleware sets secure HTTP headers
- No debug endpoints in production (conditional on NODE_ENV)
- Disabled Express x-powered-by header
- Docker containers run as non-root user
- Environment-specific config files with strict validation

### A6: Vulnerable Components

**Mitigations**:
- Dependencies audited weekly via `npm audit` in CI
- Dependabot configured for automated PRs on vulnerable dependencies
- Node.js version pinned in Docker image and .nvmrc
- Only necessary packages installed (no bloated dependencies)
- Regular review of unused dependencies

### A7: Identification and Authentication Failures

**Mitigations**:
- JWT access tokens short-lived (15 minutes)
- Opaque refresh tokens with rotation (old token invalidated on refresh)
- Token replay detection (see [06-authentication.md](06-authentication.md))
- Failed login rate limiting (5 attempts per 15 minutes -> 15 min lockout)
- Strong password policy (min 8 chars, complexity requirements)
- Email verification required before full access
- Session invalidation on password change

### A8: Software and Data Integrity Failures

**Mitigations**:
- No direct file uploads without validation (MIME type, size, extension restrictions)
- Packages installed from npm registry with lockfiles
- CI/CD pipeline integrity: all deployments go through CI, never manual
- Webhook payloads validated with signatures (future)

### A9: Security Logging and Monitoring

**Mitigations**:
- All auth failures logged (user ID, IP, timestamp, failure reason)
- All RBAC denials logged (user, resource, permission attempted)
- Structured logging with correlation IDs for request tracing
- Error monitoring (Sentry/DataDog integration - future)
- Alert on: 5+ auth failures from same IP in 5 minutes, 50+ 403 responses in 5 minutes

### A10: Server-Side Request Forgery

**Mitigations**:
- No feature that fetches arbitrary user-provided URLs (future webhook system will have allowlist)
- File uploads stored locally or in S3, never fetched from user-provided URLs
- Internal services communicate via known Docker network, not over public internet

## Input Validation

### Zod Schema Validation

All API inputs are validated using Zod schemas at the controller boundary:

```typescript
// Pattern for every create/update endpoint
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  description: z.string().max(50000, 'Description too long').nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done', 'archived']).optional(),
  assigneeIds: z.array(z.string().uuid()).max(20).optional(),
  // ... etc
}).strict(); // Reject unknown fields
```

**Validation rules**:
- `.strict()` on all schemas to reject unexpected fields
- String lengths bounded with reasonable limits
- UUID validation on all ID fields
- Enums for constrained string fields
- Integers validated with .int() to prevent float injection
- Dates validated with .datetime() or custom date parsers

### HTML Sanitization

- All user-generated content (descriptions, comments) sanitized with DOMPurify before rendering
- Markdown rendered to HTML on the server, sanitized, then served
- Raw markdown is stored in the database; HTML is computed at read time

## Password Policy

| Requirement | Value |
|-------------|-------|
| Minimum length | 8 characters |
| Maximum length | 128 characters |
| Uppercase | At least 1 |
| Lowercase | At least 1 |
| Digit | At least 1 |
| Special character | Not required for MVP |
| Password history | Not stored (future) |
| Maximum failed attempts | 5 per 15 min -> 15 min lockout |

Password strength indicator on frontend uses zxcvbn library.

## Secrets Management

### Environment Variables

```bash
# .env.example - all secrets documented with descriptions
# NEVER commit .env files. .env.example is the template.

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pmplatform

# JWT
JWT_ACCESS_SECRET=min-64-chars-random-string
JWT_REFRESH_SECRET=another-64-chars-random-string

# Redis
REDIS_URL=redis://:password@localhost:6379

# Email (SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=sg-xxx

# Storage
STORAGE_TYPE=local   # or s3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=pmplatform-uploads

# Frontend
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

### Production Secrets

In production, secrets are loaded from:
1. Docker secrets (swarm mode) or
2. Environment variables set by CI/CD pipeline, or
3. Secrets manager (AWS Secrets Manager / HashiCorp Vault)

**Never**:
- Hardcode secrets in code
- Log secrets in debug output
- Include secrets in error responses
- Store secrets in version control

## HTTP Security Headers

Configured via Helmet.js middleware:

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
```

## CORS Configuration

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-*'],
}));
```

## File Upload Security

| Check | Implementation |
|-------|---------------|
| File size | Reject > 10MB at multer level |
| MIME type | Validate against allowlist |
| File extension | Block .exe, .sh, .bat, .dll, .msi, .vbs, .jar |
| Virus scanning | Future: ClamAV integration |
| Storage path | UUID-based naming, no user-controlled paths |

## Rate Limiting

See [20-redis-strategy.md](20-redis-strategy.md) for implementation details.

| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| All API | 1000 | 1 minute |
| Auth (login, register) | 10 | 1 minute |
| Forgot password | 5 | 1 hour per email |
| Search | 60 | 1 minute |
| File upload | 30 | 1 minute |
| Socket.IO events | 10 | 1 second per socket |

## Operational Security

- **Docker**: Containers run as non-root user. No privileged containers. Read-only root filesystem where possible.
- **Database**: Dedicated database user per environment. No DDL access from application user (migrations run via separate user/admin).
- **Backups**: Daily automated backups. Encrypted at rest. Tested restore monthly.
- **Logging**: No PII in logs. User IDs and request IDs are safe. Email addresses are logged only in auth-related entries.
- **Monitoring**: Alerts for unusual activity spikes, error rate increases, and authentication failure bursts.

## Incident Response

1. **Detection**: Monitoring alert or user report
2. **Containment**: Revoke compromised tokens, disable affected user accounts
3. **Investigation**: Query activity logs and auth logs for the affected period
4. **Remediation**: Patch vulnerability, rotate secrets
5. **Communication**: Notify affected users if data was exposed

## Security Checklist Before Production

- [ ] All routes have RBAC middleware
- [ ] No CORS wildcard
- [ ] Helmet.js enabled
- [ ] Rate limiting configured for all public endpoints
- [ ] Password policy enforced
- [ ] Email verification working
- [ ] File upload validation secure
- [ ] SQL injection tests pass
- [ ] XSS tests pass
- [ ] Secrets externalized to environment
- [ ] Docker non-root user configured
- [ ] npm audit passes
- [ ] HTTPS configured with valid certificate
- [ ] Database encrypted at rest
- [ ] Logging configured with PII scrubbing
