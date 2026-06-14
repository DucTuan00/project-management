import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentApi } from './api';

export function useAttachments(taskId: string) {
  return useQuery({
    queryKey: ['task', taskId, 'attachments'],
    queryFn: () => attachmentApi.getByTask(taskId),
    enabled: !!taskId,
  });
}

export function useUploadAttachment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => attachmentApi.upload(taskId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['task', taskId, 'attachments'],
      });
    },
  });
}

export function useDeleteAttachment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) => attachmentApi.delete(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['task', taskId, 'attachments'],
      });
    },
  });
}

export function useDownloadAttachment() {
  return useMutation({
    mutationFn: async ({ attachmentId, fileName }: { attachmentId: string; fileName: string }) => {
      const blob = await attachmentApi.download(attachmentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}
