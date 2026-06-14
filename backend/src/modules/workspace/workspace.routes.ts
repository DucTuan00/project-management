import { Router } from 'express';
import { AppDataSource } from '@/config/database';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { RoleRepository } from '@/modules/role/role.repository';
import { WorkspaceRepository } from '@/modules/workspace/workspace.repository';
import { WorkspaceService } from '@/modules/workspace/workspace.service';
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

const authRepository = new AuthRepository(AppDataSource);
const roleRepository = new RoleRepository(AppDataSource);
const workspaceRepository = new WorkspaceRepository(AppDataSource);
const workspaceService = new WorkspaceService(workspaceRepository, authRepository, roleRepository);
const workspaceController = new WorkspaceController(workspaceService);

const router = Router();

// All workspace routes require authentication
router.use(authenticate);

// Create workspace
router.post(
  '/',
  validate(createWorkspaceSchema),
  workspaceController.create,
);

// List user's workspaces
router.get('/', workspaceController.listUserWorkspaces);

// Get workspace by ID
router.get(
  '/:workspaceId',
  validate(workspaceParamsSchema, 'params'),
  requireWorkspaceMember,
  workspaceController.getById,
);

// Update workspace
router.put(
  '/:workspaceId',
  validate(workspaceParamsSchema, 'params'),
  validate(updateWorkspaceSchema),
  requireWorkspaceMember,
  workspaceController.update,
);

// Delete workspace
router.delete(
  '/:workspaceId',
  validate(workspaceParamsSchema, 'params'),
  requireWorkspaceMember,
  workspaceController.delete,
);

// List members
router.get(
  '/:workspaceId/members',
  validate(workspaceParamsSchema, 'params'),
  requireWorkspaceMember,
  workspaceController.listMembers,
);

// Invite member
router.post(
  '/:workspaceId/members',
  validate(workspaceParamsSchema, 'params'),
  validate(inviteMemberSchema),
  requireWorkspaceMember,
  workspaceController.inviteMember,
);

// Update member role
router.put(
  '/:workspaceId/members/:memberId',
  validate(workspaceParamsSchema, 'params'),
  validate(updateMemberRoleSchema),
  requireWorkspaceMember,
  workspaceController.updateMemberRole,
);

// Remove member
router.delete(
  '/:workspaceId/members/:memberId',
  validate(workspaceParamsSchema, 'params'),
  requireWorkspaceMember,
  workspaceController.removeMember,
);

// Transfer ownership
router.post(
  '/:workspaceId/transfer-ownership',
  validate(workspaceParamsSchema, 'params'),
  validate(transferOwnershipSchema),
  requireWorkspaceMember,
  workspaceController.transferOwnership,
);

export default router;
