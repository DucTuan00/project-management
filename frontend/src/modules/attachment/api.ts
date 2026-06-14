import apiClient from '@/lib/api-client';
import { Attachment } from './types';

export const attachmentApi = {
  getByTask: async (taskId: string): Promise<Attachment[]> => {
    const response = await apiClient.get(`/tasks/${taskId}/attachments`);
    return response.data.data;
  },

  upload: async (taskId: string, file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  download: async (attachmentId: string): Promise<Blob> => {
    const response = await apiClient.get(`/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  delete: async (attachmentId: string): Promise<void> => {
    await apiClient.delete(`/attachments/${attachmentId}`);
  },
};
