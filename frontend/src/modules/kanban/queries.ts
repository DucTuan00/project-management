import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kanbanApi } from './api';
import { TaskStatus } from '@/lib/constants';

export function useBoard(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId, 'board'],
    queryFn: () => kanbanApi.getBoard(projectId),
    enabled: !!projectId,
  });
}

export function useMoveTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      data,
    }: {
      taskId: string;
      data: { status: TaskStatus; order: number };
    }) => kanbanApi.moveTask(taskId, data),
    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({
        queryKey: ['project', projectId, 'board'],
      });

      const previousBoard = queryClient.getQueryData([
        'project',
        projectId,
        'board',
      ]);

      queryClient.setQueryData(
        ['project', projectId, 'board'],
        (old: any) => {
          if (!old) return old;

          const newBoard = { ...old };
          let movedTask = null;

          // Find and remove from source
          for (const [status, tasks] of Object.entries(newBoard.tasks)) {
            const taskArray = tasks as any[];
            const index = taskArray.findIndex((t: any) => t.id === taskId);
            if (index !== -1) {
              movedTask = taskArray[index];
              newBoard.tasks = {
                ...newBoard.tasks,
                [status]: taskArray.filter((t: any) => t.id !== taskId),
              };
              break;
            }
          }

          // Add to destination
          if (movedTask) {
            const updatedTask = {
              ...movedTask,
              status: data.status,
              order: data.order,
            };
            const destTasks = [...(newBoard.tasks[data.status] || [])];
            destTasks.splice(data.order, 0, updatedTask);
            newBoard.tasks = {
              ...newBoard.tasks,
              [data.status]: destTasks,
            };
          }

          return newBoard;
        }
      );

      return { previousBoard };
    },
    onError: (_, __, context) => {
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
