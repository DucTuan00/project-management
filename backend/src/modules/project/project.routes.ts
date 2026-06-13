import { Router } from 'express';
import { ProjectController } from '@/modules/project/project.controller';
import { validate } from '@/shared/middleware/validate.middleware';
import { authenticate } from '@/shared/middleware/auth.middleware';
import { requireWorkspaceMember } from '@/shared/middleware/rbac.middleware';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  listProjectsParamsSchema,
  listProjectsQuerySchema,
} from '@/modules/project/project.dto';

const router = Router();

// All project routes require authentication
router.use(authenticate);

// List projects in workspace
router.get(
  '/workspace/:workspaceId',
  validate(listProjectsParamsSchema, 'params'),
  validate(listProjectsQuerySchema, 'query'),
  requireWorkspaceMember,
  ProjectController.listByWorkspace,
);

// Create project in workspace
router.post(
  '/workspace/:workspaceId',
  validate(createProjectSchema, 'body'),
  requireWorkspaceMember,
  ProjectController.create,
);

// Get project by ID
router.get(
  '/:projectId',
  ProjectController.getById,
);

// Update project
router.put(
  '/:projectId',
  validate(updateProjectSchema),
  ProjectController.update,
);

// Delete project
router.delete(
  '/:projectId',
  ProjectController.delete,
);

// List project members
router.get(
  '/:projectId/members',
  ProjectController.listMembers,
);

// Add project member
router.post(
  '/:projectId/members',
  validate(addMemberSchema),
  ProjectController.addMember,
);

// Remove project member
router.delete(
  '/:projectId/members/:memberId',
  ProjectController.removeMember,
);

export default router;
