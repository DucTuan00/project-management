import { Request, Response, NextFunction } from 'express';
import { AttachmentService } from '@/modules/attachment/attachment.service';
import { successResponse } from '@/shared/dto/response.dto';

export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json(successResponse({ message: 'No file provided' }));
        return;
      }

      const result = await this.attachmentService.upload(
        req.params.taskId,
        req.user!.userId,
        req.file,
      );
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  listByTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.attachmentService.listByTask(
        req.params.taskId,
        req.user!.userId,
      );
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  download = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { buffer, fileName, mimeType } = await this.attachmentService.download(
        req.params.attachmentId,
        req.user!.userId,
      );

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.attachmentService.delete(
        req.params.attachmentId,
        req.user!.userId,
      );
      res.status(200).json(successResponse({ message: 'Attachment deleted successfully' }));
    } catch (error) {
      next(error);
    }
  };
}
