'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  createProjectSchema,
  CreateProjectFormData,
  updateProjectSchema,
  UpdateProjectFormData,
} from '../schemas';

interface ProjectFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    name: string;
    key?: string;
    description?: string;
  };
  onSubmit: (data: CreateProjectFormData | UpdateProjectFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ProjectForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: ProjectFormProps) {
  const schema = mode === 'create' ? createProjectSchema : updateProjectSchema;
  type FormData = mode extends 'create' ? CreateProjectFormData : UpdateProjectFormData;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Project Name"
        placeholder="My Project"
        error={errors.name?.message}
        {...register('name')}
      />

      {mode === 'create' && (
        <Input
          label="Project Key"
          placeholder="PRJ"
          helperText="Used as prefix for task IDs (e.g., PRJ-1)"
          error={(errors as CreateProjectFormData)?.key?.message}
          {...register('key')}
        />
      )}

      <Textarea
        label="Description"
        placeholder="A brief description of your project"
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isLoading}>
          {mode === 'create' ? 'Create Project' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
