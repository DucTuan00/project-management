'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  createWorkspaceSchema,
  CreateWorkspaceFormData,
  updateWorkspaceSchema,
  UpdateWorkspaceFormData,
} from '../schemas';

interface WorkspaceFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    name: string;
    description?: string;
  };
  onSubmit: (data: CreateWorkspaceFormData | UpdateWorkspaceFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function WorkspaceForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: WorkspaceFormProps) {
  const schema = mode === 'create' ? createWorkspaceSchema : updateWorkspaceSchema;
  type FormData = mode extends 'create' ? CreateWorkspaceFormData : UpdateWorkspaceFormData;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  });

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      <Input
        label="Workspace Name"
        placeholder="My Workspace"
        error={errors.name?.message}
        {...register('name')}
      />

      <Textarea
        label="Description"
        placeholder="A brief description of your workspace"
        error={errors.description?.message}
        {...register('description')}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isLoading}>
          {mode === 'create' ? 'Create Workspace' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
}
