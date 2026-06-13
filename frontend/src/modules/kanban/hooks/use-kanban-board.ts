'use client';

import { useState, useCallback } from 'react';
import {
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/modules/task/types';
import { useMoveTask } from '../queries';

interface UseKanbanBoardProps {
  projectId: string;
  initialTasks: Record<TaskStatus, Task[]>;
}

export function useKanbanBoard({ projectId, initialTasks }: UseKanbanBoardProps) {
  const [tasks, setTasks] = useState<Record<TaskStatus, Task[]>>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const moveTask = useMoveTask(projectId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findColumnByTaskId = useCallback(
    (taskId: string): TaskStatus | undefined => {
      for (const [status, columnTasks] of Object.entries(tasks)) {
        if (columnTasks.some((t) => t.id === taskId)) {
          return status as TaskStatus;
        }
      }
      return undefined;
    },
    [tasks]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const task = Object.values(tasks)
        .flat()
        .find((t) => t.id === active.id);
      if (task) {
        setActiveTask(task);
      }
    },
    [tasks]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeColumn = findColumnByTaskId(activeId);
      const overColumn = findColumnByTaskId(overId) || (overId as TaskStatus);

      if (!activeColumn || activeColumn === overColumn) return;

      setTasks((prev) => {
        const newTasks = { ...prev };
        const activeTasks = [...prev[activeColumn]];
        const overTasks = [...prev[overColumn]];

        const activeIndex = activeTasks.findIndex((t) => t.id === activeId);
        if (activeIndex === -1) return prev;

        const [movedTask] = activeTasks.splice(activeIndex, 1);
        movedTask.status = overColumn;

        const overIndex = overTasks.findIndex((t) => t.id === overId);
        if (overIndex === -1) {
          overTasks.push(movedTask);
        } else {
          overTasks.splice(overIndex, 0, movedTask);
        }

        newTasks[activeColumn] = activeTasks;
        newTasks[overColumn] = overTasks;

        return newTasks;
      });
    },
    [findColumnByTaskId]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeColumn = findColumnByTaskId(activeId);
      if (!activeColumn) return;

      setTasks((prev) => {
        const columnTasks = prev[activeColumn];
        const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
        const newIndex = columnTasks.findIndex((t) => t.id === overId);

        if (oldIndex === -1) return prev;

        let newColumnTasks: Task[];
        if (oldIndex === newIndex) {
          newColumnTasks = columnTasks;
        } else {
          newColumnTasks = arrayMove(columnTasks, oldIndex, newIndex);
        }

        // Update order for each task in the column
        const updatedTasks = newColumnTasks.map((task, index) => ({
          ...task,
          order: index,
        }));

        // Persist changes to server
        updatedTasks.forEach((task, index) => {
          moveTask.mutate({
            taskId: task.id,
            data: {
              status: activeColumn,
              order: index,
            },
          });
        });

        return {
          ...prev,
          [activeColumn]: updatedTasks,
        };
      });
    },
    [findColumnByTaskId, moveTask]
  );

  const addTaskToColumn = useCallback((column: TaskStatus, task: Task) => {
    setTasks((prev) => ({
      ...prev,
      [column]: [...prev[column], task],
    }));
  }, []);

  return {
    tasks,
    activeTask,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    addTaskToColumn,
  };
}
