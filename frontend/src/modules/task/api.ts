import apiClient from '@/lib/api-client';
import { Task, CreateTaskRequest, UpdateTaskRequest, MoveTaskRequest } from './types';

export const taskApi = {
  getByProject: async (projectId: string): Promise<Task[]> => {
    const response = await apiClient.get(`/tasks/project/${projectId}`);
    return response.data.data;
  },

  getById: async (taskId: string): Promise<Task> => {
    const response = await apiClient.get(`/tasks/${taskId}`);
    return response.data.data;
  },

  create: async (data: CreateTaskRequest): Promise<Task> => {
    const response = await apiClient.post('/tasks', data);
    return response.data.data;
  },

  update: async (taskId: string, data: UpdateTaskRequest): Promise<Task> => {
    const response = await apiClient.put(`/tasks/${taskId}`, data);
    return response.data.data;
  },

  delete: async (taskId: string): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}`);
  },

  changeStatus: async (taskId: string, status: string): Promise<Task> => {
    const response = await apiClient.put(`/tasks/${taskId}/status`, { status });
    return response.data.data;
  },

  move: async (taskId: string, data: MoveTaskRequest): Promise<Task> => {
    const response = await apiClient.put(`/tasks/${taskId}/status`, {
      status: data.status,
    });
    return response.data.data;
  },

  getBoard: async (projectId: string): Promise<Record<string, Task[]>> => {
    const response = await apiClient.get(`/projects/${projectId}/board`);
    return response.data.data;
  },
};
