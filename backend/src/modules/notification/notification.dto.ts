import { z } from 'zod';

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z.coerce.boolean().default(false),
});

export const markReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).optional(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>;
export type MarkReadDto = z.infer<typeof markReadSchema>;
