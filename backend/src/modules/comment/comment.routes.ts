import { Router } from 'express';
import { AppDataSource } from '@/config/database';
import { CommentRepository } from '@/modules/comment/comment.repository';
import { TaskRepository } from '@/modules/task/task.repository';
import { ProjectRepository } from '@/modules/project/project.repository';
import { CommentService } from '@/modules/comment/comment.service';
import { CommentController } from '@/modules/comment/comment.controller';
import { validate } from '@/shared/middleware/validate.middleware';
import { authenticate } from '@/shared/middleware/auth.middleware';
import {
  createCommentSchema,
  updateCommentSchema,
  commentParamsSchema,
  listCommentsQuerySchema,
} from '@/modules/comment/comment.dto';

const commentRepository = new CommentRepository(AppDataSource);
const taskRepository = new TaskRepository(AppDataSource);
const projectRepository = new ProjectRepository(AppDataSource);
const commentService = new CommentService(commentRepository, taskRepository, projectRepository);
const commentController = new CommentController(commentService);

const router = Router();

// All comment routes require authentication
router.use(authenticate);

// List comments for a task
router.get(
  '/tasks/:taskId/comments',
  validate(commentParamsSchema, 'params'),
  validate(listCommentsQuerySchema, 'query'),
  commentController.listByTask,
);

// Create comment on a task
router.post(
  '/tasks/:taskId/comments',
  validate(commentParamsSchema, 'params'),
  validate(createCommentSchema),
  commentController.create,
);

// Update a comment
router.patch(
  '/comments/:commentId',
  validate(updateCommentSchema),
  commentController.update,
);

// Delete a comment
router.delete(
  '/comments/:commentId',
  commentController.delete,
);

export default router;
