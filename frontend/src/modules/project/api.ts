import apiClient from '@/lib/api-client';
import {
  Project,
  ProjectMember,
  CreateProjectRequest,
  UpdateProjectRequest,
  UpdateProjectSettingsRequest,
} from './types';

export const projectApi = {
  getByWorkspace: async (workspaceId: string): Promise<Project[]> => {
    const response = await apiClient.get(`/projects/workspace/${workspaceId}`);
    return response.data.data;
  },

  getById: async (projectId: string): Promise<Project> => {
    const response = await apiClient.get(`/projects/${projectId}`);
    return response.data.data;
  },

  create: async (
    workspaceId: string,
    data: CreateProjectRequest
  ): Promise<Project> => {
    const response = await apiClient.post(
      `/projects/workspace/${workspaceId}`,
      data
    );
    return response.data.data;
  },

  update: async (
    projectId: string,
    data: UpdateProjectRequest
  ): Promise<Project> => {
    const response = await apiClient.put(`/projects/${projectId}`, data);
    return response.data.data;
  },

  delete: async (projectId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}`);
  },

  getMembers: async (projectId: string): Promise<ProjectMember[]> => {
    const response = await apiClient.get(`/projects/${projectId}/members`);
    return response.data.data;
  },

  addMember: async (
    projectId: string,
    userId: string,
    roleId: string
  ): Promise<ProjectMember> => {
    const response = await apiClient.post(`/projects/${projectId}/members`, {
      userId,
      roleId,
    });
    return response.data.data;
  },

  removeMember: async (projectId: string, memberId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/members/${memberId}`);
  },

  getSettings: async (projectId: string): Promise<{ columns: Array<{ id: string; name: string; order: number; wipLimit?: number }> }> => {
    const response = await apiClient.get(`/projects/${projectId}`);
    return response.data.data?.settings || { columns: [] };
  },

  updateSettings: async (
    projectId: string,
    data: UpdateProjectSettingsRequest
  ): Promise<void> => {
    await apiClient.put(`/projects/${projectId}`, { settings: data });
  },
};
