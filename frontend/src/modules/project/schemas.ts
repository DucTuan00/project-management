import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  key: z
    .string()
    .min(2, 'Key must be at least 2 characters')
    .max(10, 'Key must be less than 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Key must contain only uppercase letters and numbers'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

export type CreateProjectFormData = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

export type UpdateProjectFormData = z.infer<typeof updateProjectSchema>;

export const columnSchema = z.object({
  name: z.string().min(1, 'Column name is required'),
  color: z.string().optional(),
  wipLimit: z.number().min(0).optional(),
});

export type ColumnFormData = z.infer<typeof columnSchema>;
