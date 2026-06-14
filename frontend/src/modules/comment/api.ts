import apiClient from '@/lib/api-client';
import { Comment, CreateCommentRequest, UpdateCommentRequest } from './types';

export const commentApi = {
  getByTask: async (taskId: string): Promise<Comment[]> => {
    const response = await apiClient.get(`/tasks/${taskId}/comments`);
    return response.data.data;
  },

  create: async (taskId: string, data: CreateCommentRequest): Promise<Comment> => {
    const response = await apiClient.post(`/tasks/${taskId}/comments`, data);
    return response.data.data;
  },

  update: async (commentId: string, data: UpdateCommentRequest): Promise<Comment> => {
    const response = await apiClient.patch(`/comments/${commentId}`, data);
    return response.data.data;
  },

  delete: async (commentId: string): Promise<void> => {
    await apiClient.delete(`/comments/${commentId}`);
  },
};
