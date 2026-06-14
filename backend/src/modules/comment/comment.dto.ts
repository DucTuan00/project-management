import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content is required')
    .max(50000, 'Comment must not exceed 50000 characters'),
  parentId: z.string().uuid('Invalid parent comment ID').optional(),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content is required')
    .max(50000, 'Comment must not exceed 50000 characters'),
});

export const commentParamsSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  commentId: z.string().uuid('Invalid comment ID').optional(),
});

export const listCommentsSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>;
export type UpdateCommentDto = z.infer<typeof updateCommentSchema>;
export type ListCommentsQuery = z.infer<typeof listCommentsSchema>;
