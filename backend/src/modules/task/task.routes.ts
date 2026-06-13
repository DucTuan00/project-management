import { Router } from 'express';
import { TaskController } from '@/modules/task/task.controller';
import { validate } from '@/shared/middleware/validate.middleware';
import { authenticate } from '@/shared/middleware/auth.middleware';
import {
  createTaskSchema,
  updateTaskSchema,
  changeStatusSchema,
  assigneeSchema,
  dependencySchema,
  listTasksSchema,
} from '@/modules/task/task.dto';

const router = Router();

// All task routes require authentication
router.use(authenticate);

// Create task
router.post(
  '/',
  validate(createTaskSchema),
  TaskController.create,
);

// List tasks in project
router.get(
  '/project/:projectId',
  validate(listTasksSchema, 'params'),
  validate(listTasksSchema, 'query'),
  TaskController.listByProject,
);

// Get task by ID
router.get(
  '/:taskId',
  TaskController.getById,
);

// Update task
router.put(
  '/:taskId',
  validate(updateTaskSchema),
  TaskController.update,
);

// Delete task
router.delete(
  '/:taskId',
  TaskController.delete,
);

// Change task status
router.put(
  '/:taskId/status',
  validate(changeStatusSchema),
  TaskController.changeStatus,
);

// Assign user to task
router.post(
  '/:taskId/assignees',
  validate(assigneeSchema),
  TaskController.assignUser,
);

// Remove assignee
router.delete(
  '/:taskId/assignees/:userId',
  TaskController.removeAssignee,
);

// Add dependency
router.post(
  '/:taskId/dependencies',
  validate(dependencySchema),
  TaskController.addDependency,
);

// Remove dependency
router.delete(
  '/:taskId/dependencies/:dependsOnTaskId',
  TaskController.removeDependency,
);

export default router;
