import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(200, 'Workspace name must not exceed 200 characters'),
  description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(200, 'Workspace name must not exceed 200 characters')
    .optional(),
  description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
  logoUrl: z.string().url('Invalid URL').max(500).optional(),
  settings: z.record(z.any()).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  roleId: z.string().uuid('Invalid role ID'),
});

export const updateMemberRoleSchema = z.object({
  roleId: z.string().uuid('Invalid role ID'),
});

export const transferOwnershipSchema = z.object({
  newOwnerId: z.string().uuid('Invalid user ID'),
});

export const workspaceParamsSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
});

export type CreateWorkspaceDto = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceDto = z.infer<typeof updateWorkspaceSchema>;
export type InviteMemberDto = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleDto = z.infer<typeof updateMemberRoleSchema>;
export type TransferOwnershipDto = z.infer<typeof transferOwnershipSchema>;
