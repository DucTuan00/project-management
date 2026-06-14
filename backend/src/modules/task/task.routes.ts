import { Router } from 'express';
import { AppDataSource } from '@/config/database';
import { TaskController } from '@/modules/task/task.controller';
import { TaskRepository } from '@/modules/task/task.repository';
import { ProjectRepository } from '@/modules/project/project.repository';
import { TaskService } from '@/modules/task/task.service';
import { validate } from '@/shared/middleware/validate.middleware';
import { authenticate } from '@/shared/middleware/auth.middleware';
import {
  createTaskSchema,
  updateTaskSchema,
  changeStatusSchema,
  assigneeSchema,
  dependencySchema,
  listTasksParamsSchema,
  listTasksQuerySchema,
} from '@/modules/task/task.dto';

const taskRepository = new TaskRepository(AppDataSource);
const projectRepository = new ProjectRepository(AppDataSource);
const taskService = new TaskService(taskRepository, projectRepository);
const taskController = new TaskController(taskService);

const router = Router();

// All task routes require authentication
router.use(authenticate);

// Create task
router.post(
  '/',
  validate(createTaskSchema),
  taskController.create,
);

// List tasks in project
router.get(
  '/project/:projectId',
  validate(listTasksParamsSchema, 'params'),
  validate(listTasksQuerySchema, 'query'),
  taskController.listByProject,
);

// Get task by ID
router.get(
  '/:taskId',
  taskController.getById,
);

// Update task
router.put(
  '/:taskId',
  validate(updateTaskSchema),
  taskController.update,
);

// Delete task
router.delete(
  '/:taskId',
  taskController.delete,
);

// Change task status
router.put(
  '/:taskId/status',
  validate(changeStatusSchema),
  taskController.changeStatus,
);

// Assign user to task
router.post(
  '/:taskId/assignees',
  validate(assigneeSchema),
  taskController.assignUser,
);

// Remove assignee
router.delete(
  '/:taskId/assignees/:userId',
  taskController.removeAssignee,
);

// Add dependency
router.post(
  '/:taskId/dependencies',
  validate(dependencySchema),
  taskController.addDependency,
);

// Remove dependency
router.delete(
  '/:taskId/dependencies/:dependsOnTaskId',
  taskController.removeDependency,
);

export default router;
