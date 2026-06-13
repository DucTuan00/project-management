import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from './api';
import { CreateTaskRequest, UpdateTaskRequest, MoveTaskRequest } from './types';

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId, 'tasks'],
    queryFn: () => taskApi.getByProject(projectId),
    enabled: !!projectId,
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskApi.getById(taskId),
    enabled: !!taskId,
  });
}

export function useTaskBoard(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId, 'board'],
    queryFn: () => taskApi.getBoard(projectId),
    enabled: !!projectId,
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskRequest) => taskApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project', projectId, 'tasks'],
      });
      queryClient.invalidateQueries({
        queryKey: ['project', projectId, 'board'],
      });
    },
  });
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskRequest }) =>
      taskApi.update(taskId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['project', projectId, 'tasks'],
      });
      queryClient.invalidateQueries({
        queryKey: ['project', projectId, 'board'],
      });
      queryClient.invalidateQueries({
        queryKey: ['task', variables.taskId],
      });
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => taskApi.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project', projectId, 'tasks'],
      });
      queryClient.invalidateQueries({
        queryKey: ['project', projectId, 'board'],
      });
    },
  });
}

export function useMoveTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: MoveTaskRequest }) =>
      taskApi.move(taskId, data),
    onMutate: async ({ taskId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['project', projectId, 'board'],
      });

      // Snapshot previous value
      const previousBoard = queryClient.getQueryData([
        'project',
        projectId,
        'board',
      ]);

      // Optimistically update
      queryClient.setQueryData(
        ['project', projectId, 'board'],
        (old: Record<string, any[]> | undefined) => {
          if (!old) return old;

          // Find and remove task from current column
          const newBoard = { ...old };
          let movedTask = null;

          for (const [columnId, tasks] of Object.entries(newBoard)) {
            const taskIndex = tasks.findIndex((t: any) => t.id === taskId);
            if (taskIndex !== -1) {
              movedTask = tasks[taskIndex];
              newBoard[columnId] = [...tasks];
              newBoard[columnId].splice(taskIndex, 1);
              break;
            }
          }

          // Add task to new column
          if (movedTask) {
            const updatedTask = {
              ...movedTask,
              status: data.status,
              boardColumnId: data.boardColumnId || data.status,
            };
            if (!newBoard[data.status]) {
              newBoard[data.status] = [];
            }
            newBoard[data.status] = [...newBoard[data.status], updatedTask];
          }

          return newBoard;
        }
      );

      return { previousBoard };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousBoard) {
        queryClient.setQueryData(
          ['project', projectId, 'board'],
          context.previousBoard
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['project', projectId, 'board'],
      });
      queryClient.invalidateQueries({
        queryKey: ['project', projectId, 'tasks'],
      });
    },
  });
}
