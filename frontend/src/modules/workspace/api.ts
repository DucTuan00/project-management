import apiClient from '@/lib/api-client';
import {
  Workspace,
  WorkspaceMember,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
} from './types';

export const workspaceApi = {
  getAll: async (): Promise<Workspace[]> => {
    const response = await apiClient.get('/workspaces');
    return response.data.data;
  },

  getById: async (id: string): Promise<Workspace> => {
    const response = await apiClient.get(`/workspaces/${id}`);
    return response.data.data;
  },

  create: async (data: CreateWorkspaceRequest): Promise<Workspace> => {
    const response = await apiClient.post('/workspaces', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateWorkspaceRequest): Promise<Workspace> => {
    const response = await apiClient.put(`/workspaces/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/workspaces/${id}`);
  },

  getMembers: async (workspaceId: string): Promise<WorkspaceMember[]> => {
    const response = await apiClient.get(`/workspaces/${workspaceId}/members`);
    return response.data.data;
  },

  inviteMember: async (
    workspaceId: string,
    data: InviteMemberRequest
  ): Promise<WorkspaceMember> => {
    const response = await apiClient.post(
      `/workspaces/${workspaceId}/members`,
      data
    );
    return response.data.data;
  },

  updateMemberRole: async (
    workspaceId: string,
    memberId: string,
    data: UpdateMemberRoleRequest
  ): Promise<WorkspaceMember> => {
    const response = await apiClient.put(
      `/workspaces/${workspaceId}/members/${memberId}`,
      data
    );
    return response.data.data;
  },

  removeMember: async (workspaceId: string, memberId: string): Promise<void> => {
    await apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`);
  },
};
