'use client';

import React, { useRef } from 'react';
import {
  Paperclip,
  Download,
  Trash2,
  Image,
  FileText,
  File,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import { useAttachments, useUploadAttachment, useDeleteAttachment, useDownloadAttachment } from '../queries';
import { useToast } from '@/components/ui/toast';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { formatDate } from '@/lib/utils';

interface AttachmentListProps {
  taskId: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image className="h-5 w-5 text-primary-500" />;
  if (mimeType.includes('pdf')) return <FileText className="h-5 w-5 text-danger-500" />;
  return <File className="h-5 w-5 text-gray-500" />;
}

export function AttachmentList({ taskId }: AttachmentListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: attachments, isLoading } = useAttachments(taskId);
  const uploadAttachment = useUploadAttachment(taskId);
  const deleteAttachment = useDeleteAttachment(taskId);
  const downloadAttachment = useDownloadAttachment();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast('File size must be less than 10MB', 'error');
      return;
    }

    try {
      await uploadAttachment.mutateAsync(file);
      toast('File uploaded successfully', 'success');
    } catch (error) {
      toast('Failed to upload file', 'error');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (attachmentId: string, fileName: string) => {
    try {
      await downloadAttachment.mutateAsync({ attachmentId, fileName });
    } catch (error) {
      toast('Failed to download file', 'error');
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (window.confirm('Are you sure you want to delete this attachment?')) {
      try {
        await deleteAttachment.mutateAsync(attachmentId);
        toast('Attachment deleted', 'success');
      } catch (error) {
        toast('Failed to delete attachment', 'error');
      }
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-900">
              Attachments ({attachments?.length || 0})
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            loading={uploadAttachment.isPending}
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        ) : attachments && attachments.length > 0 ? (
          <div className="space-y-3">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50"
              >
                {getFileIcon(attachment.mimeType)}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {attachment.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {attachment.fileSizeFormatted} · {attachment.uploader.displayName} ·{' '}
                    {formatDate(attachment.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment.id, attachment.fileName)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {attachment.uploader.id === user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(attachment.id)}
                    >
                      <Trash2 className="h-4 w-4 text-danger-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Paperclip className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No attachments yet</p>
            <p className="text-xs text-gray-400">Upload files up to 10MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
