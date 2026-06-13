import apiClient from '@/lib/api-client';
import { BoardData } from './types';
import { TaskStatus } from '@/lib/constants';

export const kanbanApi = {
  getBoard: async (projectId: string): Promise<BoardData> => {
    const response = await apiClient.get(`/projects/${projectId}/board`);
    return response.data.data;
  },

  moveTask: async (
    taskId: string,
    data: { status: TaskStatus; order: number }
  ): Promise<void> => {
    await apiClient.patch(`/tasks/${taskId}/move`, data);
  },

  updateColumnOrder: async (
    projectId: string,
    columns: Array<{ id: string; order: number }>
  ): Promise<void> => {
    await apiClient.put(`/projects/${projectId}/board/columns`, { columns });
  },
};
