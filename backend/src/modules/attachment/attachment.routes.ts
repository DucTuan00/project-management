import { Router } from 'express';
import multer from 'multer';
import { AppDataSource } from '@/config/database';
import { AttachmentRepository } from '@/modules/attachment/attachment.repository';
import { TaskRepository } from '@/modules/task/task.repository';
import { ProjectRepository } from '@/modules/project/project.repository';
import { AttachmentService } from '@/modules/attachment/attachment.service';
import { AttachmentController } from '@/modules/attachment/attachment.controller';
import { authenticate } from '@/shared/middleware/auth.middleware';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const attachmentRepository = new AttachmentRepository(AppDataSource);
const taskRepository = new TaskRepository(AppDataSource);
const projectRepository = new ProjectRepository(AppDataSource);
const attachmentService = new AttachmentService(attachmentRepository, taskRepository, projectRepository);
const attachmentController = new AttachmentController(attachmentService);

const router = Router();

// All attachment routes require authentication
router.use(authenticate);

// List attachments for a task
router.get(
  '/tasks/:taskId/attachments',
  attachmentController.listByTask,
);

// Upload attachment to a task
router.post(
  '/tasks/:taskId/attachments',
  upload.single('file'),
  attachmentController.upload,
);

// Download attachment
router.get(
  '/attachments/:attachmentId/download',
  attachmentController.download,
);

// Delete attachment
router.delete(
  '/attachments/:attachmentId',
  attachmentController.delete,
);

export default router;
