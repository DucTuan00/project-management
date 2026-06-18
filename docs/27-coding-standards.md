# Coding Standards

## Purpose
Define consistent coding standards across the TypeScript codebase including naming conventions, file structure, formatting rules, and best practices for both frontend and backend.

## TypeScript Configuration

### Backend tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Frontend tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] },
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| Files/ Directories | kebab-case | `task.service.ts`, `auth-middleware.ts` |
| Classes | PascalCase | `WorkspaceService`, `CreateTaskDto` |
| Interfaces | PascalCase | `IWorkspaceRepository`, `TaskResponse` |
| Types | PascalCase | `TaskStatus`, `PriorityLevel` |
| Functions | camelCase | `createTask()`, `findByEmail()` |
| Variables | camelCase | `workspaceId`, `userRepository` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `JWT_EXPIRY` |
| Enums | PascalCase (enum), UPPER_SNAKE_CASE (values) | `enum TaskStatus { BACKLOG, TODO, IN_PROGRESS }` |
| DTO schemas | camelCase with Schema suffix | `createTaskSchema`, `loginSchema` |
| Routes file | name.routes.ts | `workspace.routes.ts` |
| Module index | name.module.ts | `auth.module.ts` |

## File Organization

### Backend Module Structure

Every module follows this exact structure:

```
modules/<name>/
+-- <name>.controller.ts    - Route handlers, request/response mapping
+-- <name>.service.ts       - Business logic
+-- <name>.repository.ts    - TypeORM data access
+-- <name>.entity.ts        - TypeORM entity definition
+-- <name>.dto.ts           - Zod validation schemas
+-- <name>.routes.ts        - Express router setup
+-- <name>.module.ts        - Module registration/exports
+-- <name>.events.ts        - Domain event definitions
+-- <name>.types.ts         - Module-specific types
+-- __tests__/
    +-- <name>.service.test.ts
    +-- <name>.integration.test.ts
```

### Frontend Module Structure

```
modules/<name>/
+-- components/
    +-- <Name>List.tsx
    +-- <Name>Form.tsx
    +-- <Name>Detail.tsx
+-- hooks/
    +-- use<Name>.ts         - Custom hooks
+-- queries.ts               - TanStack Query hooks (useQuery, useMutation)
+-- schemas.ts               - Zod schemas
+-- types.ts                 - Module-specific types
+-- api.ts                   - API client functions for this module
```

## Formatting Rules

Enforced by ESLint + Prettier:

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 120,
  "tabWidth": 2,
  "endOfLine": "lf",
  "arrowParens": "always",
  "bracketSpacing": true
}
```

### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
      },
    ],
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
```

## Code Patterns

### Error Handling

```typescript
// GOOD: Explicit error handling with typed errors
async function getTask(taskId: string): Promise<Task> {
  const task = await taskRepository.findById(taskId);
  if (!task) {
    throw new NotFoundError('TASK_NOT_FOUND', `Task with id '${taskId}' not found`);
  }
  return task;
}

// BAD: Returning null or undefined
async function getTask(taskId: string): Promise<Task | null> {
  return taskRepository.findById(taskId);
}
```

### Async/Await

```typescript
// GOOD: Use async/await instead of raw promises
async function createWorkspace(userId: string, dto: CreateWorkspaceDto): Promise<Workspace> {
  const workspace = await workspaceRepository.create({ ...dto, ownerId: userId });
  await eventBus.publish({ name: 'workspace.created', ... });
  return workspace;
}

// BAD: Promise chains in business logic
function createWorkspace(userId: string, dto: CreateWorkspaceDto): Promise<Workspace> {
  return workspaceRepository.create({ ...dto, ownerId: userId })
    .then(workspace => eventBus.publish({ ... }).then(() => workspace));
}
```

### Dependency Injection

```typescript
// GOOD: Constructor injection via class
class WorkspaceService {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly eventBus: EventBus,
    private readonly logger: Logger,
  ) {}

  async create(userId: string, dto: CreateWorkspaceDto): Promise<Workspace> {
    this.logger.info({ userId }, 'Creating workspace');
    // ...
  }
}

// BAD: Global imports and singletons
class WorkspaceService {
  async create(userId: string, dto: CreateWorkspaceDto): Promise<Workspace> {
    // Directly importing and using repository singleton
    const workspace = await WorkspaceRepository.getInstance().create({ ... });
    return workspace;
  }
}
```

### Validation

```typescript
// GOOD: Zod validation at controller boundary
const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
}).strict();

// Controller validates immediately
async createTask(req: Request, res: Response) {
  const dto = createTaskSchema.parse(req.body); // Throws ZodError on invalid
  const task = await taskService.create(req.user.id, req.params.projectId, dto);
  res.status(201).json({ success: true, data: task });
}
```

### Service Layer Separation

```typescript
// GOOD: Service returns data, controller handles HTTP
// Controller
async getTask(req: Request, res: Response) {
  const task = await taskService.getTask(req.params.taskId, req.user.id);
  res.json({ success: true, data: task });
}

// Service
async getTask(taskId: string, userId: string): Promise<TaskResponse> {
  const task = await this.repository.findById(taskId);
  if (!task) throw new NotFoundError(...);
  // No HTTP concepts here
  return this.toResponse(task);
}

// BAD: Controller calls repository directly
async getTask(req: Request, res: Response) {
  const task = await taskRepository.findById(req.params.taskId);
  if (!task) return res.status(404).json(...);
  res.json(task);
}
```

## Database Migration Conventions

```typescript
// GOOD: Descriptive migration name
// 1712345678900-CreateWorkspacesTable.ts

// Migration pattern:
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateWorkspacesTable1712345678900 implements MigrationInterface {
  name = 'CreateWorkspacesTable1712345678900';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'workspaces',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'name', type: 'varchar', length: '200', isNullable: false },
        // ...
      ],
    }));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('workspaces');
  }
}
```

## Git Commit Messages

Follow Conventional Commits specification. See [28-git-workflow.md](28-git-workflow.md) for full details.

## Design Decisions

- **Explicit over implicit** - Always prefer explicit types, explicit error handling, and explicit dependency injection over magic patterns.
- **One export per file** - Each file exports one primary thing (class, function, or type). Barrel exports (index.ts) aggregate for convenience.
- **No barrel imports in production code** - Barrel imports can cause circular dependencies and tree-shaking issues. Import directly from file.
- **3rd party imports first, then internal** - Imports ordered by external -> internal -> relative. Separated by blank line.

## Best Practices

1. **Prefer `const` over `let`** - Use `const` unless reassignment is required.
2. **Avoid `any` at all costs** - If you must use it, add a comment explaining why and add a TODO to remove it.
3. **Keep functions small** - If a function exceeds 40 lines, extract helper functions.
4. **Return early** - Guard clauses at the top of functions reduce nesting and improve readability.
5. **Favor flat over nested** - Avoid deeply nested if/else or try/catch blocks.
6. **Type everything explicitly** - Function parameters and return types must be explicit.
7. **No magic strings** - Use constants/enums for repeated string values.
8. **Colocate tests with source** - Tests live in `__tests__/` next to the file they test.
9. **Never commit commented-out code** - Delete it. Git history preserves it.
10. **Prefer early returns** - Reduces cognitive load by handling edge cases first.
