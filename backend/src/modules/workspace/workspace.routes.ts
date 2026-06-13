import { Router } from 'express';
import { WorkspaceController } from '@/modules/workspace/workspace.controller';
import { validate } from '@/shared/middleware/validate.middleware';
import { authenticate } from '@/shared/middleware/auth.middleware';
import { requireWorkspaceMember } from '@/shared/middleware/rbac.middleware';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  transferOwnershipSchema,
  workspaceParamsSchema,
} from '@/modules/workspace/workspace.dto';

const router = Router();

// All workspace routes require authentication
router.use(authenticate);

// Create workspace
router.post(
  '/',
  validate(createWorkspaceSchema),
  WorkspaceController.create,
);

// List user's workspaces
router.get('/', WorkspaceController.listUserWorkspaces);

// Get workspace by ID
router.get(
  '/:workspaceId',
  validate(workspaceParamsSchema, 'params'),
  requireWorkspaceMember,
  WorkspaceController.getById,
);

// Update workspace
router.put(
  '/:workspaceId',
  validate(workspaceParamsSchema, 'params'),
  validate(updateWorkspaceSchema),
  requireWorkspaceMember,
  WorkspaceController.update,
);

// Delete workspace
router.delete(
  '/:workspaceId',
  validate(workspaceParamsSchema, 'params'),
  requireWorkspaceMember,
  WorkspaceController.delete,
);

// List members
router.get(
  '/:workspaceId/members',
  validate(workspaceParamsSchema, 'params'),
  requireWorkspaceMember,
  WorkspaceController.listMembers,
);

// Invite member
router.post(
  '/:workspaceId/members',
  validate(workspaceParamsSchema, 'params'),
  validate(inviteMemberSchema),
  requireWorkspaceMember,
  WorkspaceController.inviteMember,
);

// Update member role
router.put(
  '/:workspaceId/members/:memberId',
  validate(workspaceParamsSchema, 'params'),
  validate(updateMemberRoleSchema),
  requireWorkspaceMember,
  WorkspaceController.updateMemberRole,
);

// Remove member
router.delete(
  '/:workspaceId/members/:memberId',
  validate(workspaceParamsSchema, 'params'),
  requireWorkspaceMember,
  WorkspaceController.removeMember,
);

// Transfer ownership
router.post(
  '/:workspaceId/transfer-ownership',
  validate(workspaceParamsSchema, 'params'),
  validate(transferOwnershipSchema),
  requireWorkspaceMember,
  WorkspaceController.transferOwnership,
);

export default router;
