'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { KanbanCard } from './kanban-card';
import { Task, TaskStatus } from '@/modules/task/types';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: string;
  name: string;
  taskStatus: TaskStatus;
  tasks: Task[];
  wipLimit?: number;
  projectKey: string;
  onTaskClick?: (task: Task) => void;
  onAddTask?: (status: TaskStatus) => void;
}

const columnColors: Record<string, string> = {
  backlog: 'border-gray-300',
  todo: 'border-blue-500',
  in_progress: 'border-amber-500',
  review: 'border-purple-500',
  done: 'border-green-500',
  archived: 'border-gray-400',
};

export function KanbanColumn({
  id,
  name,
  taskStatus,
  tasks,
  wipLimit,
  projectKey,
  onTaskClick,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: taskStatus,
  });

  const isOverWipLimit = wipLimit && tasks.length >= wipLimit;

  return (
    <div
      className={cn(
        'w-80 flex-shrink-0 rounded-lg bg-gray-50',
        isOver && 'bg-gray-100'
      )}
    >
      <div
        className={cn(
          'rounded-t-lg border-t-4 bg-white px-3 py-2',
          columnColors[taskStatus] || 'border-gray-300'
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">{name}</h3>
          <span
            className={cn(
              'text-xs font-medium',
              isOverWipLimit ? 'text-danger-600' : 'text-gray-500'
            )}
          >
            {tasks.length}
            {wipLimit && `/${wipLimit}`}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="min-h-[200px] p-2 space-y-2"
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              projectKey={projectKey}
              onClick={() => onTaskClick?.(task)}
            />
          ))}
        </SortableContext>

        {onAddTask && (
          <button
            onClick={() => onAddTask(taskStatus)}
            className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 p-2 text-sm text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add task
          </button>
        )}
      </div>
    </div>
  );
}
