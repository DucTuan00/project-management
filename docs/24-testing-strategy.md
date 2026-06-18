# Testing Strategy

## Purpose
Define the testing strategy including test types (unit, integration, E2E), tooling, coverage requirements, CI gate configuration, and testing patterns for each layer of the application.

## Testing Pyramid

```
         /\
        /  \          E2E (5%)
       /    \         Playwright
      /      \
     /--------\
    /  Integ.  \     Integration (25%)
   /   (API)    \    Supertest + Testcontainers
  /              \
 /----------------\
/    Unit Tests    \   Unit (70%)
\    (Services)    /   Vitest + mocks
 \----------------/
```

## Tooling

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit tests | Vitest | Fast, Jest-compatible, ESM-native |
| Integration tests | Vitest + Supertest | API testing with HTTP assertions |
| Integration DB | Testcontainers | PostgreSQL/Redis containers for tests |
| E2E tests | Playwright | Browser-based full flow testing |
| Coverage | c8 / nyc | Istanbul-compatible coverage reporter |
| Mocking | vitest-mock-extended | TypeORM repository mocking |

## Unit Tests

### Target

All service methods in every module must have unit tests covering:
- Happy path (expected input -> expected output)
- Error cases (invalid input, not found, forbidden)
- Edge cases (empty lists, null values, boundary conditions)

### Service Test Pattern

```typescript
// modules/workspace/__tests__/workspace.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceService } from '../workspace.service';

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let mockRepo: MockProxy<WorkspaceRepository>;
  let mockEventBus: MockProxy<EventBus>;

  beforeEach(() => {
    mockRepo = mock<WorkspaceRepository>();
    mockEventBus = mock<EventBus>();
    service = new WorkspaceService(mockRepo, mockEventBus);
  });

  describe('createWorkspace', () => {
    it('should create workspace and return it', async () => {
      // Arrange
      const userId = 'user-uuid';
      const dto = { name: 'My Workspace', description: 'Test' };
      const expectedWorkspace = { id: 'ws-uuid', name: 'My Workspace', slug: 'my-workspace' };
      mockRepo.create.mockResolvedValue(expectedWorkspace);

      // Act
      const result = await service.createWorkspace(userId, dto);

      // Assert
      expect(result).toEqual(expectedWorkspace);
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'My Workspace',
        ownerId: userId,
      }));
      expect(mockEventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        name: 'workspace.created',
      }));
    });

    it('should throw when name is empty', async () => {
      // Arrange
      const dto = { name: '', description: 'Test' };

      // Act & Assert
      await expect(service.createWorkspace('user-id', dto))
        .rejects.toThrow(ValidationError);
    });

    it('should generate unique slug on duplicate', async () => {
      // Arrange
      mockRepo.findBySlug
        .mockResolvedValueOnce({ id: 'existing' }) // First slug taken
        .mockResolvedValueOnce(null);                // Second slug available

      // Act
      const result = await service.createWorkspace('user-id', { name: 'My Workspace' });

      // Assert
      expect(result.slug).toBe('my-workspace-2');
    });
  });
});
```

### Controller Test Pattern

Controllers are tested in integration tests via Supertest. Unit testing controllers in isolation provides low value because their logic is thin. Integration tests with Supertest cover controller + middleware + service paths.

## Integration Tests

### Setup

```typescript
// tests/setup.ts
import { PostgreSqlContainer, RedisContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { createApp } from '../src/app';

let app: Express;
let dataSource: DataSource;

beforeAll(async () => {
  // Start PostgreSQL container
  const pgContainer = await new PostgreSqlContainer()
    .withDatabase('pmplatform_test')
    .start();

  // Start Redis container
  const redisContainer = await new RedisContainer().start();

  // Configure DataSource with container connection
  dataSource = new DataSource({
    type: 'postgres',
    url: pgContainer.getConnectionUri(),
    entities: ['src/modules/**/*.entity.ts'],
    synchronize: true, // Create schema for tests
  });
  await dataSource.initialize();

  // Create Express app with test config
  app = createApp({
    database: dataSource,
    redisUrl: redisContainer.getConnectionUri(),
  });
});

afterAll(async () => {
  await dataSource.destroy();
  await pgContainer.stop();
  await redisContainer.stop();
});
```

### API Integration Test Pattern

```typescript
// modules/auth/__tests__/auth.integration.test.ts
import supertest from 'supertest';

describe('Auth API', () => {
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(() => {
    request = supertest(app);
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com', password: 'Password1', displayName: 'Test User' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      // First registration
      await request.post('/api/v1/auth/register')
        .send({ email: 'dup@example.com', password: 'Password1', displayName: 'User 1' })
        .expect(201);

      // Duplicate
      const res = await request.post('/api/v1/auth/register')
        .send({ email: 'dup@example.com', password: 'Password1', displayName: 'User 2' })
        .expect(409);

      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should reject weak password', async () => {
      await request.post('/api/v1/auth/register')
        .send({ email: 'weak@example.com', password: 'short', displayName: 'User' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return tokens on valid credentials', async () => {
      // Arrange - register first
      await request.post('/api/v1/auth/register')
        .send({ email: 'login@example.com', password: 'Password1', displayName: 'Login User' });

      // Act
      const res = await request.post('/api/v1/auth/login')
        .send({ email: 'login@example.com', password: 'Password1' })
        .expect(200);

      // Assert
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject invalid password', async () => {
      // Register then try wrong password
      await request.post('/api/v1/auth/register')
        .send({ email: 'wrongpwd@example.com', password: 'Password1', displayName: 'User' });

      await request.post('/api/v1/auth/login')
        .send({ email: 'wrongpwd@example.com', password: 'WrongPassword1' })
        .expect(401);
    });
  });
});
```

## E2E Tests

### Playwright Setup

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('complete registration and login flow', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');

    // Fill registration form
    await page.fill('[data-testid="register-email"]', 'e2e@example.com');
    await page.fill('[data-testid="register-password"]', 'Password1');
    await page.fill('[data-testid="register-display-name"]', 'E2E User');
    await page.click('[data-testid="register-submit"]');

    // Should redirect to verification notice
    await expect(page.locator('[data-testid="verification-sent"]')).toBeVisible();

    // Navigate to login
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'e2e@example.com');
    await page.fill('[data-testid="login-password"]', 'Password1');
    await page.click('[data-testid="login-submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText('E2E User');
  });

  test('kanban drag and drop', async ({ page }) => {
    // Login first
    await loginAsTestUser(page);

    // Navigate to project board
    await page.goto('/project/test-project/board');

    // Get initial task count in "todo" column
    const todoColumn = page.locator('[data-testid="column-todo"]');
    const initialTaskCount = await todoColumn.locator('[data-testid="task-card"]').count();

    // Drag first task from "backlog" to "todo"
    const taskCard = page.locator('[data-testid="column-backlog"] [data-testid="task-card"]').first();
    await taskCard.dragTo(todoColumn);

    // Wait for optimistic update
    await page.waitForTimeout(500);

    // Check that todo column has one more task
    await expect(todoColumn.locator('[data-testid="task-card"]')).toHaveCount(initialTaskCount + 1);
  });
});
```

## Coverage Requirements

| Metric | Minimum | Notes |
|--------|---------|-------|
| Lines | 80% | Overall codebase |
| Branches | 75% | Conditional logic |
| Functions | 85% | All exported functions |
| Statements | 80% | Overall |
| New code | 90% | In PRs (diff coverage) |

**Coverage exclusions**: Main entry points, type definitions, barrel exports, configuration files.

## CI Gate Configuration

```yaml
# In GitHub Actions workflow
test:
  steps:
    - run: npm run test:unit
    - run: npm run test:integration
    - run: npx vitest --coverage --reporter=junit --outputFile=coverage/junit.xml
    - uses: davelosert/vitest-coverage-report-action@v2
      with:
        json-summary-path: ./coverage/coverage-summary.json
```

**CI Gate Rules**:
1. All unit tests must pass
2. All integration tests must pass
3. Coverage must meet minimum thresholds
4. No flaky tests - any test that fails intermittently is quarantined and fixed within 48 hours

## Test Data Factories

```typescript
// tests/factories/user.factory.ts
import { faker } from '@faker-js/faker';

export function buildUser(overrides: Partial<User> = {}): Partial<User> {
  return {
    email: faker.internet.email().toLowerCase(),
    displayName: faker.person.fullName(),
    password: 'TestPassword1',
    isEmailVerified: true,
    ...overrides,
  };
}
```

Using faker.js for realistic test data. Factories are composable:

```typescript
const user = buildUser();
const workspace = buildWorkspace({ ownerId: user.id });
const project = buildProject({ workspaceId: workspace.id, leadId: user.id });
```

## Testing Best Practices

1. **No network calls in unit tests** - All external dependencies (DB, Redis, email) must be mocked.
2. **Isolated test databases** - Integration tests use Testcontainers, never the development database.
3. **Deterministic tests** - No random values without seed. faker.seed(42) for reproducible test data.
4. **Arrange-Act-Assert** - Every test follows this pattern. No assertions in Arrange phase.
5. **One assertion concept per test** - A test should verify one thing, even if it has multiple expect() calls related to that thing.
6. **Test the contract, not the implementation** - Test behavior (return values, side effects), not internal method calls.
7. **Clean up between tests** - Database reset or transaction rollback after each test.
8. **Name tests as sentences** - `it('should reject invalid email format')` not `it('testInvalidEmail')`.

## Design Decisions

- **Vitest over Jest** - Faster startup, ESM-native, better TypeScript integration, compatible API with Jest. Migration path if Jest-like ecosystem is needed.
- **Testcontainers over in-memory DB** - Tests run against real PostgreSQL/Redis, not SQLite-in-memory substitutes that behave differently. CI uses service containers (Docker-in-Docker).
- **Supertest over superagent** - Supertest works with the Express app directly (no network), making API tests fast and self-contained.
- **No snapshot testing for API responses** - Snapshot tests are brittle for API responses (timestamps, UUIDs). Use explicit assertions on relevant fields.

## Flaky Test Policy

1. If a test fails non-deterministically, quarantine it by moving to `__tests__/flaky/` directory
2. Root cause must be identified within 5 working days
3. If root cause is a race condition, fix with `waitFor` or proper async handling
4. If root cause is environmental, add retry logic with `test.retry(2)` for that specific test
5. Track flaky test ratio - must stay below 1% of total tests
