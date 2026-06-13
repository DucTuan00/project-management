'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, AlertCircle, Bug, BookOpen, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Task } from '../types';
import {
  PRIORITY_COLORS,
  TYPE_COLORS,
  PRIORITY_LABELS,
  TYPE_LABELS,
} from '@/lib/constants';
import { formatDate } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  projectKey: string;
  isDragging?: boolean;
}

const typeIcons = {
  task: <Layers className="h-3 w-3" />,
  bug: <Bug className="h-3 w-3" />,
  story: <BookOpen className="h-3 w-3" />,
  epic: <AlertCircle className="h-3 w-3" />,
};

export function TaskCard({ task, projectKey, isDragging }: TaskCardProps) {
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <Link href={`/project/${task.projectId}/task/${task.id}`}>
      <div
        className={cn(
          'rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md cursor-pointer',
          isDragging && 'shadow-lg ring-2 ring-primary-500'
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 line-clamp-2">
            {task.title}
          </p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="default" className="text-xs">
            {projectKey}-{task.id.slice(-4).toUpperCase()}
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
            {task.assignee && (
              <Avatar
                src={task.assignee.avatar}
                name={task.assignee.name}
                size="sm"
              />
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
    </Link>
  );
}
