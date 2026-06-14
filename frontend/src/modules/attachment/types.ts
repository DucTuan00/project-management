export interface AttachmentUploader {
  id: string;
  displayName: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  mimeType: string;
  uploader: AttachmentUploader;
  createdAt: string;
  isImage: boolean;
  thumbnailUrl: string | null;
}
