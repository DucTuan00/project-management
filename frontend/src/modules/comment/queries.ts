import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi } from './api';
import { CreateCommentRequest, UpdateCommentRequest } from './types';

export function useComments(taskId: string) {
  return useQuery({
    queryKey: ['task', taskId, 'comments'],
    queryFn: () => commentApi.getByTask(taskId),
    enabled: !!taskId,
  });
}

export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentRequest) => commentApi.create(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['task', taskId, 'comments'],
      });
    },
  });
}

export function useUpdateComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: UpdateCommentRequest }) =>
      commentApi.update(commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['task', taskId, 'comments'],
      });
    },
  });
}

export function useDeleteComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentApi.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['task', taskId, 'comments'],
      });
    },
  });
}
