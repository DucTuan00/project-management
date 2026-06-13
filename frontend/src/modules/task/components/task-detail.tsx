'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Calendar,
  Tag,
  User,
  Clock,
  Trash2,
  Edit2,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { Task } from '../types';
import { useUpdateTask, useDeleteTask } from '../queries';
import { updateTaskSchema, UpdateTaskFormData } from '../schemas';
import {
  STATUS_COLORS,
  PRIORITY_COLORS,
  TYPE_COLORS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  TYPE_LABELS,
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_TYPES,
} from '@/lib/constants';
import { formatDate, cn } from '@/lib/utils';

interface TaskDetailProps {
  task: Task;
  projectKey: string;
  members?: Array<{ id: string; name: string; avatar?: string }>;
}

export function TaskDetail({ task, projectKey, members = [] }: TaskDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const updateTask = useUpdateTask(task.projectId);
  const deleteTask = useDeleteTask(task.projectId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateTaskFormData>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: task.title,
      description: task.description || '',
      type: task.type,
      priority: task.priority,
      status: task.status,
      assigneeId: task.assigneeId || null,
      storyPoints: task.storyPoints || null,
      dueDate: task.dueDate || null,
    },
  });

  const onSubmit = async (data: UpdateTaskFormData) => {
    try {
      await updateTask.mutateAsync({ taskId: task.id, data });
      setIsEditing(false);
      toast('Task updated successfully', 'success');
    } catch (error) {
      toast('Failed to update task', 'error');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask.mutateAsync(task.id);
        toast('Task deleted successfully', 'success');
      } catch (error) {
        toast('Failed to delete task', 'error');
      }
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        data: { status: status as any },
      });
      toast('Status updated', 'success');
    } catch (error) {
      toast('Failed to update status', 'error');
    }
  };

  if (isEditing) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Edit Task</h2>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  reset();
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" loading={updateTask.isPending}>
                <Check className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <input
              {...register('title')}
              className="w-full text-xl font-semibold text-gray-900 border-0 border-b border-gray-200 focus:border-primary-500 focus:ring-0 pb-2"
              placeholder="Task title"
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Status"
                options={Object.entries(STATUS_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                error={errors.status?.message}
                {...register('status')}
              />

              <Select
                label="Priority"
                options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                error={errors.priority?.message}
                {...register('priority')}
              />

              <Select
                label="Type"
                options={Object.entries(TYPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                error={errors.type?.message}
                {...register('type')}
              />

              <Select
                label="Assignee"
                options={[
                  { value: '', label: 'Unassigned' },
                  ...members.map((m) => ({
                    value: m.id,
                    label: m.name,
                  })),
                ]}
                error={errors.assigneeId?.message}
                {...register('assigneeId')}
              />

              <input
                type="number"
                {...register('storyPoints', { valueAsNumber: true })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Story Points"
              />

              <input
                type="date"
                {...register('dueDate')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[150px]"
                placeholder="Add a description..."
              />
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {projectKey}-{task.id.slice(-4).toUpperCase()}
            </span>
            <Badge className={TYPE_COLORS[task.type]}>{TYPE_LABELS[task.type]}</Badge>
          </div>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">{task.title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
              {task.description || 'No description provided.'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Status */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
            <Select
              options={Object.entries(STATUS_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              value={task.status}
              onChange={handleStatusChange}
            />
          </div>

          {/* Priority */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Priority</h3>
            <Badge className={PRIORITY_COLORS[task.priority]}>
              {PRIORITY_LABELS[task.priority]}
            </Badge>
          </div>

          {/* Assignee */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Assignee</h3>
            {task.assignee ? (
              <div className="flex items-center gap-2">
                <Avatar
                  src={task.assignee.avatar}
                  name={task.assignee.name}
                  size="sm"
                />
                <span className="text-sm text-gray-700">{task.assignee.name}</span>
              </div>
            ) : (
              <span className="text-sm text-gray-400">Unassigned</span>
            )}
          </div>

          {/* Due Date */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Due Date</h3>
            {task.dueDate ? (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span
                  className={cn(
                    'text-sm',
                    new Date(task.dueDate) < new Date() && task.status !== 'done'
                      ? 'text-danger-600'
                      : 'text-gray-700'
                  )}
                >
                  {formatDate(task.dueDate)}
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-400">No due date</span>
            )}
          </div>

          {/* Story Points */}
          {task.storyPoints && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Story Points</h3>
              <Badge variant="primary">{task.storyPoints}</Badge>
            </div>
          )}

          {/* Reporter */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Reporter</h3>
            {task.reporter && (
              <div className="flex items-center gap-2">
                <Avatar
                  src={task.reporter.avatar}
                  name={task.reporter.name}
                  size="sm"
                />
                <span className="text-sm text-gray-700">{task.reporter.name}</span>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <p>Created: {formatDate(task.createdAt)}</p>
              <p>Updated: {formatDate(task.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
