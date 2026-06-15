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
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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
  if (mimeType.startsWith('image/')) return <Image style={{ fontSize: '20px', color: '#ff4f00' }} />;
  if (mimeType.includes('pdf')) return <FileText style={{ fontSize: '20px', color: '#dc2626' }} />;
  return <File style={{ fontSize: '20px', color: '#939084' }} />;
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
    <Box
      sx={{
        borderRadius: '12px',
        border: '1px solid #c5c0b1',
        backgroundColor: '#fffefb',
      }}
    >
      <Box
        sx={{
          borderBottom: '1px solid #c5c0b1',
          px: 2,
          py: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Paperclip style={{ fontSize: '16px', color: '#939084' }} />
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#201515', fontSize: '14px' }}>
              Attachments ({attachments?.length || 0})
            </Typography>
          </Box>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            loading={uploadAttachment.isPending}
          >
            <Upload size={16} style={{ marginRight: '4px' }} />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
        </Box>
      </Box>

      <Box sx={{ p: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <LoadingSpinner size="sm" />
          </Box>
        ) : attachments && attachments.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {attachments.map((attachment) => (
              <Box
                key={attachment.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  borderRadius: '12px',
                  border: '1px solid #f8f4f0',
                  p: 1.5,
                  '&:hover': {
                    backgroundColor: '#f8f4f0',
                  },
                  transition: 'background-color 0.2s',
                }}
              >
                {getFileIcon(attachment.mimeType)}

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: '#201515',
                      fontSize: '14px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {attachment.fileName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#939084', fontSize: '12px' }}>
                    {attachment.fileSizeFormatted} · {attachment.uploader.displayName} ·{' '}
                    {formatDate(attachment.createdAt)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment.id, attachment.fileName)}
                  >
                    <Download size={16} />
                  </Button>
                  {attachment.uploader.id === user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(attachment.id)}
                    >
                      <Trash2 size={16} sx={{ color: '#dc2626' }} />
                    </Button>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Paperclip style={{ fontSize: '32px', color: '#939084', margin: '0 auto', display: 'block' }} />
            <Typography variant="body2" sx={{ mt: 1, color: '#939084', fontSize: '14px' }}>
              No attachments yet
            </Typography>
            <Typography variant="caption" sx={{ color: '#c5c0b1', fontSize: '12px' }}>
              Upload files up to 10MB
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
