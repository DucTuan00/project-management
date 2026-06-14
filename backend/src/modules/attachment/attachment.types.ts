import { Attachment } from '@/modules/attachment/attachment.entity';

export interface AttachmentUploader {
  id: string;
  displayName: string;
}

export interface AttachmentResponse {
  id: string;
  taskId: string;
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  mimeType: string;
  uploader: AttachmentUploader;
  createdAt: Date;
  isImage: boolean;
  thumbnailUrl: string | null;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function toAttachmentResponse(attachment: Attachment & { uploader?: any }): AttachmentResponse {
  const isImage = attachment.mimeType.startsWith('image/');
  return {
    id: attachment.id,
    taskId: attachment.taskId,
    fileName: attachment.fileName,
    fileSize: attachment.fileSize,
    fileSizeFormatted: formatFileSize(attachment.fileSize),
    mimeType: attachment.mimeType,
    uploader: attachment.uploader
      ? {
          id: attachment.uploader.id,
          displayName: attachment.uploader.displayName,
        }
      : { id: '', displayName: 'Unknown' },
    createdAt: attachment.createdAt,
    isImage,
    thumbnailUrl: isImage ? `/api/v1/attachments/${attachment.id}/thumbnail` : null,
  };
}
