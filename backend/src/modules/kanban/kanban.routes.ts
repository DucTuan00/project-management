import { Router } from 'express';
import { AppDataSource } from '@/config/database';
import { KanbanController } from '@/modules/kanban/kanban.controller';
import { KanbanService } from '@/modules/kanban/kanban.service';
import { TaskRepository } from '@/modules/task/task.repository';
import { ProjectRepository } from '@/modules/project/project.repository';
import { validate } from '@/shared/middleware/validate.middleware';
import { authenticate } from '@/shared/middleware/auth.middleware';
import { batchUpdatePositionsSchema } from '@/modules/task/task.dto';
import { z } from 'zod';

const taskRepository = new TaskRepository(AppDataSource);
const projectRepository = new ProjectRepository(AppDataSource);
const kanbanService = new KanbanService(taskRepository, projectRepository);
const kanbanController = new KanbanController(kanbanService);

const router = Router();

const boardParamsSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
});

// All kanban routes require authentication
router.use(authenticate);

// Get kanban board
router.get(
  '/projects/:projectId/board',
  validate(boardParamsSchema, 'params'),
  kanbanController.getBoard,
);

// Batch update positions
router.put(
  '/projects/:projectId/board/position',
  validate(boardParamsSchema, 'params'),
  validate(batchUpdatePositionsSchema),
  kanbanController.batchUpdatePositions,
);

export default router;
