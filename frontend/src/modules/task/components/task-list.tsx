'use client';

import React from 'react';
import { MoreHorizontal, Plus, Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown } from '@/components/ui/dropdown';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Task } from '../types';
import {
  STATUS_COLORS,
  PRIORITY_COLORS,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from '@/lib/constants';
import { formatDate, cn } from '@/lib/utils';

interface TaskListProps {
  tasks: Task[];
  projectKey: string;
  isLoading?: boolean;
  onCreateTask?: () => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function TaskList({
  tasks,
  projectKey,
  isLoading,
  onCreateTask,
  onEditTask,
  onDeleteTask,
}: TaskListProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="No tasks yet"
        description="Create your first task to get started."
        action={
          onCreateTask
            ? { label: 'Create Task', onClick: onCreateTask }
            : undefined
        }
      />
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Key
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Priority
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Assignee
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Due Date
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-500">
                  {projectKey}-{task.id.slice(-4).toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm font-medium text-gray-900">
                  {task.title}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge className={STATUS_COLORS[task.status]}>
                  {STATUS_LABELS[task.status]}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge className={PRIORITY_COLORS[task.priority]}>
                  {PRIORITY_LABELS[task.priority]}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={task.assignee.avatar}
                      name={task.assignee.name}
                      size="sm"
                    />
                    <span className="text-sm text-gray-700">
                      {task.assignee.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Unassigned</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {task.dueDate ? (
                  <span
                    className={cn(
                      'text-sm',
                      new Date(task.dueDate) < new Date() && task.status !== 'done'
                        ? 'text-danger-600'
                        : 'text-gray-500'
                    )}
                  >
                    {formatDate(task.dueDate)}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">No due date</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <Dropdown
                  trigger={
                    <button className="p-1 text-gray-400 hover:text-gray-500">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  }
                  items={[
                    {
                      label: 'Edit',
                      icon: <Edit className="h-4 w-4" />,
                      onClick: () => onEditTask?.(task),
                    },
                    {
                      label: 'Delete',
                      icon: <Trash2 className="h-4 w-4" />,
                      onClick: () => onDeleteTask?.(task.id),
                      danger: true,
                    },
                  ]}
                  align="right"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
