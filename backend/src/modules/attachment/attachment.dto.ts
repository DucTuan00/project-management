import { z } from 'zod';

export const attachmentParamsSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  attachmentId: z.string().uuid('Invalid attachment ID').optional(),
});

export const listAttachmentsSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
});

export type AttachmentParamsDto = z.infer<typeof attachmentParamsSchema>;
export type ListAttachmentsQuery = z.infer<typeof listAttachmentsSchema>;
