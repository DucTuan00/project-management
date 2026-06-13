'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, AlertCircle, Bug, BookOpen, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Task } from '@/modules/task/types';
import { cn } from '@/lib/utils';
import {
  PRIORITY_COLORS,
  TYPE_COLORS,
  PRIORITY_LABELS,
  TYPE_LABELS,
} from '@/lib/constants';
import { formatDate } from '@/lib/utils';

interface KanbanCardProps {
  task: Task;
  projectKey: string;
  onClick?: () => void;
  isDragging?: boolean;
}

const typeIcons: Record<string, React.ReactNode> = {
  task: <Layers className="h-3 w-3" />,
  bug: <Bug className="h-3 w-3" />,
  story: <BookOpen className="h-3 w-3" />,
  epic: <AlertCircle className="h-3 w-3" />,
};

export function KanbanCard({
  task,
  projectKey,
  onClick,
  isDragging,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-3 shadow-sm cursor-pointer transition-shadow hover:shadow-md',
        (isDragging || isSortableDragging) && 'shadow-lg ring-2 ring-primary-500 opacity-90'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 line-clamp-2">
          {task.title}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="default" className="text-xs">
          {task.displayId || `${projectKey}-${task.sequentialId}`}
        </Badge>

        <Badge
          className={cn('text-xs', TYPE_COLORS[task.type])}
        >
          <span className="flex items-center gap-1">
            {typeIcons[task.type]}
            {TYPE_LABELS[task.type]}
          </span>
        </Badge>

        <Badge className={cn('text-xs', PRIORITY_COLORS[task.priority])}>
          {PRIORITY_LABELS[task.priority]}
        </Badge>

        {task.storyPoints && (
          <Badge variant="primary" className="text-xs">
            {task.storyPoints}
          </Badge>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.assignees && task.assignees.length > 0 && (
            <div className="flex -space-x-2">
              {task.assignees.slice(0, 3).map((assignee) => (
                <Avatar
                  key={assignee.id}
                  src={assignee.user.avatarUrl}
                  name={assignee.user.displayName}
                  size="sm"
                />
              ))}
              {task.assignees.length > 3 && (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 ring-2 ring-white">
                  +{task.assignees.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {task.dueDate && (
          <span
            className={cn(
              'flex items-center gap-1 text-xs',
              isOverdue ? 'text-danger-600' : 'text-gray-500'
            )}
          >
            <Calendar className="h-3 w-3" />
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}
