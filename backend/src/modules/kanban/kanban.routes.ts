import { Router } from 'express';
import { KanbanController } from '@/modules/kanban/kanban.controller';
import { validate } from '@/shared/middleware/validate.middleware';
import { authenticate } from '@/shared/middleware/auth.middleware';
import { batchUpdatePositionsSchema } from '@/modules/task/task.dto';
import { z } from 'zod';

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
  KanbanController.getBoard,
);

// Batch update positions
router.put(
  '/projects/:projectId/board/position',
  validate(boardParamsSchema, 'params'),
  validate(batchUpdatePositionsSchema),
  KanbanController.batchUpdatePositions,
);

export default router;
