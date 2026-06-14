import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(50000, 'Comment must not exceed 50000 characters'),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(50000, 'Comment must not exceed 50000 characters'),
});

export type CreateCommentFormData = z.infer<typeof createCommentSchema>;
export type UpdateCommentFormData = z.infer<typeof updateCommentSchema>;
