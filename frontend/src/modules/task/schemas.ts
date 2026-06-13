import { z } from 'zod';
import { TASK_TYPES, TASK_PRIORITIES, TASK_STATUSES } from '@/lib/constants';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(5000, 'Description must be less than 5000 characters').optional(),
  type: z.enum([TASK_TYPES.TASK, TASK_TYPES.BUG, TASK_TYPES.STORY, TASK_TYPES.EPIC]),
  priority: z.enum([TASK_PRIORITIES.LOW, TASK_PRIORITIES.MEDIUM, TASK_PRIORITIES.HIGH, TASK_PRIORITIES.CRITICAL]),
  status: z.enum([
    TASK_STATUSES.BACKLOG,
    TASK_STATUSES.TODO,
    TASK_STATUSES.IN_PROGRESS,
    TASK_STATUSES.REVIEW,
    TASK_STATUSES.DONE,
    TASK_STATUSES.ARCHIVED,
  ]),
  assigneeId: z.string().nullable().optional(),
  storyPoints: z.number().min(0).max(100).nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

export type CreateTaskFormData = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
  description: z.string().max(5000, 'Description must be less than 5000 characters').nullable().optional(),
  type: z.enum([TASK_TYPES.TASK, TASK_TYPES.BUG, TASK_TYPES.STORY, TASK_TYPES.EPIC]).optional(),
  priority: z.enum([TASK_PRIORITIES.LOW, TASK_PRIORITIES.MEDIUM, TASK_PRIORITIES.HIGH, TASK_PRIORITIES.CRITICAL]).optional(),
  status: z.enum([
    TASK_STATUSES.BACKLOG,
    TASK_STATUSES.TODO,
    TASK_STATUSES.IN_PROGRESS,
    TASK_STATUSES.REVIEW,
    TASK_STATUSES.DONE,
    TASK_STATUSES.ARCHIVED,
  ]).optional(),
  assigneeId: z.string().nullable().optional(),
  storyPoints: z.number().min(0).max(100).nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

export type UpdateTaskFormData = z.infer<typeof updateTaskSchema>;
