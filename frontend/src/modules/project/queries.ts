import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from './api';
import {
  CreateProjectRequest,
  UpdateProjectRequest,
  UpdateProjectSettingsRequest,
} from './types';

export function useProjects(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace', workspaceId, 'projects'],
    queryFn: () => projectApi.getByWorkspace(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectApi.getById(projectId),
    enabled: !!projectId,
  });
}

export function useCreateProject(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectRequest) =>
      projectApi.create(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace', workspaceId, 'projects'],
      });
    },
  });
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProjectRequest) =>
      projectApi.update(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useDeleteProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => projectApi.delete(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId, 'members'],
    queryFn: () => projectApi.getMembers(projectId),
    enabled: !!projectId,
  });
}

export function useProjectSettings(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId, 'settings'],
    queryFn: () => projectApi.getSettings(projectId),
    enabled: !!projectId,
  });
}

export function useUpdateProjectSettings(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProjectSettingsRequest) =>
      projectApi.updateSettings(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project', projectId, 'settings'],
      });
    },
  });
}
