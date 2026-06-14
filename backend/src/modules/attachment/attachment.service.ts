import { AttachmentRepository } from '@/modules/attachment/attachment.repository';
import { TaskRepository } from '@/modules/task/task.repository';
import { ProjectRepository } from '@/modules/project/project.repository';
import {
  getStorageProvider,
  validateFile,
  StorageProvider,
} from '@/modules/attachment/storage.provider';
import { AttachmentResponse, toAttachmentResponse } from '@/modules/attachment/attachment.types';
import { NotFoundError } from '@/shared/errors/not-found';
import { ForbiddenError } from '@/shared/errors/forbidden';
import { AppError } from '@/shared/errors/app-error';
import { logger } from '@/shared/logger/logger';

export class AttachmentService {
  private storageProvider: StorageProvider;

  constructor(
    private readonly attachmentRepository: AttachmentRepository,
    private readonly taskRepository: TaskRepository,
    private readonly projectRepository: ProjectRepository,
  ) {
    this.storageProvider = getStorageProvider();
  }

  async upload(
    taskId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<AttachmentResponse> {
    // Verify task exists
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    // Verify user is a project member
    const isMember = await this.projectRepository.isMember(task.projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new AppError(validation.error!, 400, 'INVALID_FILE');
    }

    // Store file
    const result = await this.storageProvider.store(file);

    // Create attachment record
    const attachment = await this.attachmentRepository.create({
      taskId,
      uploaderId: userId,
      fileName: file.originalname,
      fileSize: result.fileSize,
      mimeType: result.mimeType,
      storagePath: result.storagePath,
      storageType: result.storageType,
    });

    const fullAttachment = await this.attachmentRepository.findById(attachment.id);

    logger.info({ attachmentId: attachment.id, taskId, userId }, 'Attachment uploaded');

    return toAttachmentResponse(fullAttachment as any);
  }

  async listByTask(taskId: string, userId: string): Promise<AttachmentResponse[]> {
    // Verify task exists
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    // Verify user is a project member
    const isMember = await this.projectRepository.isMember(task.projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    const attachments = await this.attachmentRepository.findByTaskId(taskId);
    return attachments.map(toAttachmentResponse);
  }

  async download(
    attachmentId: string,
    userId: string,
  ): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const attachment = await this.attachmentRepository.findById(attachmentId);
    if (!attachment) {
      throw new NotFoundError('Attachment');
    }

    // Verify user has access to the task
    const task = await this.taskRepository.findById(attachment.taskId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const isMember = await this.projectRepository.isMember(task.projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('Not a member of this project');
    }

    const buffer = await this.storageProvider.retrieve(attachment.storagePath);

    return {
      buffer,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
    };
  }

  async delete(attachmentId: string, userId: string): Promise<void> {
    const attachment = await this.attachmentRepository.findById(attachmentId);
    if (!attachment) {
      throw new NotFoundError('Attachment');
    }

    // Only uploader can delete
    if (attachment.uploaderId !== userId) {
      throw new ForbiddenError('You can only delete your own attachments');
    }

    // Delete from storage
    await this.storageProvider.delete(attachment.storagePath);

    // Soft delete from DB
    await this.attachmentRepository.delete(attachmentId);

    logger.info({ attachmentId, userId }, 'Attachment deleted');
  }
}
