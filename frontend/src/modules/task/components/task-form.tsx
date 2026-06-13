'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import {
  TASK_TYPES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TYPE_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '@/lib/constants';
import { createTaskSchema, CreateTaskFormData, updateTaskSchema, UpdateTaskFormData } from '../schemas';

interface TaskFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<CreateTaskFormData>;
  onSubmit: (data: CreateTaskFormData | UpdateTaskFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function TaskForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: TaskFormProps) {
  const schema = mode === 'create' ? createTaskSchema : updateTaskSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTaskFormData | UpdateTaskFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'task',
      priority: 'medium',
      status: 'todo',
      ...initialData,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Title"
        placeholder="Task title"
        error={errors.title?.message}
        {...register('title')}
      />

      <Textarea
        label="Description"
        placeholder="Add a description..."
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="grid grid-cols-2 gap-4">
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
          label="Priority"
          options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
          error={errors.priority?.message}
          {...register('priority')}
        />

        <Select
          label="Status"
          options={Object.entries(STATUS_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
          error={errors.status?.message}
          {...register('status')}
        />

        <Input
          label="Story Points"
          type="number"
          placeholder="0"
          error={errors.storyPoints?.message}
          {...register('storyPoints', { valueAsNumber: true })}
        />

        <Input
          label="Due Date"
          type="date"
          error={errors.dueDate?.message}
          {...register('dueDate')}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isLoading}>
          {mode === 'create' ? 'Create Task' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
