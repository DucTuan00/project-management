import { Router } from 'express';
import { AppDataSource } from '@/config/database';
import { ProjectController } from '@/modules/project/project.controller';
import { ProjectRepository } from '@/modules/project/project.repository';
import { WorkspaceRepository } from '@/modules/workspace/workspace.repository';
import { RoleRepository } from '@/modules/role/role.repository';
import { ProjectService } from '@/modules/project/project.service';
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

const projectRepository = new ProjectRepository(AppDataSource);
const workspaceRepository = new WorkspaceRepository(AppDataSource);
const roleRepository = new RoleRepository(AppDataSource);
const projectService = new ProjectService(projectRepository, workspaceRepository, roleRepository);
const projectController = new ProjectController(projectService);

const router = Router();

// All project routes require authentication
router.use(authenticate);

// List projects in workspace
router.get(
  '/workspace/:workspaceId',
  validate(listProjectsParamsSchema, 'params'),
  validate(listProjectsQuerySchema, 'query'),
  requireWorkspaceMember,
  projectController.listByWorkspace,
);

// Create project in workspace
router.post(
  '/workspace/:workspaceId',
  validate(createProjectSchema, 'body'),
  requireWorkspaceMember,
  projectController.create,
);

// Get project by ID
router.get(
  '/:projectId',
  projectController.getById,
);

// Update project
router.put(
  '/:projectId',
  validate(updateProjectSchema),
  projectController.update,
);

// Delete project
router.delete(
  '/:projectId',
  projectController.delete,
);

// List project members
router.get(
  '/:projectId/members',
  projectController.listMembers,
);

// Add project member
router.post(
  '/:projectId/members',
  validate(addMemberSchema),
  projectController.addMember,
);

// Remove project member
router.delete(
  '/:projectId/members/:memberId',
  projectController.removeMember,
);

export default router;
