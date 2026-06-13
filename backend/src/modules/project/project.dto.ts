import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'Project name must be at least 2 characters')
    .max(200, 'Project name must not exceed 200 characters'),
  key: z
    .string()
    .min(2, 'Project key must be at least 2 characters')
    .max(10, 'Project key must not exceed 10 characters')
    .regex(/^[A-Z][A-Z0-9]*$/, 'Project key must start with a letter and contain only uppercase letters and numbers')
    .optional(),
  description: z.string().max(2000, 'Description must not exceed 2000 characters').optional(),
  leadId: z.string().uuid('Invalid lead user ID').optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'Project name must be at least 2 characters')
    .max(200, 'Project name must not exceed 200 characters')
    .optional(),
  description: z.string().max(2000, 'Description must not exceed 2000 characters').optional(),
  leadId: z.string().uuid('Invalid lead user ID').optional(),
  status: z.enum(['active', 'archived', 'completed']).optional(),
  settings: z.record(z.any()).optional(),
});

export const projectParamsSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  workspaceId: z.string().uuid('Invalid workspace ID').optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  roleId: z.string().uuid('Invalid role ID'),
});

export const listProjectsParamsSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
});

export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['active', 'archived', 'completed']).optional(),
  search: z.string().optional(),
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>;
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;
export type AddMemberDto = z.infer<typeof addMemberSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
