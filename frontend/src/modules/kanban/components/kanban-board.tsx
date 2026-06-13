'use client';

import React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import { Task, TaskStatus } from '@/modules/task/types';
import { BoardColumn } from '../types';
import { useKanbanBoard } from '../hooks/use-kanban-board';
import { Skeleton } from '@/components/ui/skeleton';

interface KanbanBoardProps {
  projectId: string;
  columns: BoardColumn[];
  tasks: Record<TaskStatus, Task[]>;
  projectKey: string;
  onTaskClick?: (task: Task) => void;
  onAddTask?: (status: TaskStatus) => void;
}

export function KanbanBoard({
  projectId,
  columns,
  tasks: initialTasks,
  projectKey,
  onTaskClick,
  onAddTask,
}: KanbanBoardProps) {
  const {
    tasks,
    activeTask,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useKanbanBoard({ projectId, initialTasks });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns
          .sort((a, b) => a.order - b.order)
          .map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              name={column.name}
              taskStatus={column.taskStatus}
              tasks={tasks[column.taskStatus] || []}
              wipLimit={column.wipLimit}
              projectKey={projectKey}
              onTaskClick={onTaskClick}
              onAddTask={onAddTask}
            />
          ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <KanbanCard
            task={activeTask}
            projectKey={projectKey}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Loading state
export function KanbanBoardSkeleton() {
  return (
    <div className="flex gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="w-80 flex-shrink-0">
          <div className="rounded-lg bg-gray-100 p-3">
            <Skeleton className="h-5 w-24 mb-3" />
            <div className="space-y-3">
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
