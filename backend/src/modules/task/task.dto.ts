import { z } from 'zod';

const VALID_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done', 'archived'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const VALID_TYPES = ['task', 'bug', 'story', 'epic'];

export const createTaskSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must not exceed 500 characters'),
  description: z.string().max(10000, 'Description must not exceed 10000 characters').optional(),
  status: z.enum(VALID_STATUSES as [string, ...string[]]).default('backlog'),
  priority: z.enum(VALID_PRIORITIES as [string, ...string[]]).default('medium'),
  type: z.enum(VALID_TYPES as [string, ...string[]]).default('task'),
  storyPoints: z.number().int().min(0).max(100).optional(),
  dueDate: z.coerce.date().optional(),
  estimatedHours: z.number().min(0).optional(),
  parentTaskId: z.string().uuid('Invalid parent task ID').optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
  sprintId: z.string().uuid('Invalid sprint ID').optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must not exceed 500 characters')
    .optional(),
  description: z.string().max(10000, 'Description must not exceed 10000 characters').optional(),
  priority: z.enum(VALID_PRIORITIES as [string, ...string[]]).optional(),
  type: z.enum(VALID_TYPES as [string, ...string[]]).optional(),
  storyPoints: z.number().int().min(0).max(100).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  estimatedHours: z.number().min(0).nullable().optional(),
  actualHours: z.number().min(0).nullable().optional(),
  sprintId: z.string().uuid().nullable().optional(),
  parentTaskId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.any()).optional(),
});

export const changeStatusSchema = z.object({
  status: z.enum(VALID_STATUSES as [string, ...string[]]),
});

export const assigneeSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export const dependencySchema = z.object({
  dependsOnTaskId: z.string().uuid('Invalid task ID'),
  type: z.enum(['blocks', 'is-blocked-by', 'relates-to']).default('blocks'),
});

export const taskParamsSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  projectId: z.string().uuid('Invalid project ID').optional(),
});

export const listTasksParamsSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
});

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(VALID_STATUSES as [string, ...string[]]).optional(),
  priority: z.enum(VALID_PRIORITIES as [string, ...string[]]).optional(),
  type: z.enum(VALID_TYPES as [string, ...string[]]).optional(),
  assigneeId: z.string().uuid().optional(),
  sprintId: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'position', 'dueDate']).optional(),
  sortOrder: z.enum(['ASC', 'DESC']).default('ASC'),
});

export const batchUpdatePositionsSchema = z.object({
  tasks: z.array(
    z.object({
      taskId: z.string().uuid(),
      position: z.number(),
      boardColumnId: z.string(),
    }),
  ),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;
export type ChangeStatusDto = z.infer<typeof changeStatusSchema>;
export type AssigneeDto = z.infer<typeof assigneeSchema>;
export type DependencyDto = z.infer<typeof dependencySchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type BatchUpdatePositionsDto = z.infer<typeof batchUpdatePositionsSchema>;

// Status transition map
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  backlog: ['todo'],
  todo: ['in_progress', 'backlog'],
  in_progress: ['review', 'todo'],
  review: ['done', 'in_progress'],
  done: ['archived'],
  archived: [],
};

export function isValidTransition(from: string, to: string): boolean {
  const allowed = STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}
