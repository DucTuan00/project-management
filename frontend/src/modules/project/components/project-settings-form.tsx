'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useUpdateProjectSettings } from '../queries';

interface Column {
  id: string;
  name: string;
  order: number;
  wipLimit?: number;
}

interface ProjectSettingsFormProps {
  projectId: string;
  columns: Column[];
}

export function ProjectSettingsForm({
  projectId,
  columns: initialColumns,
}: ProjectSettingsFormProps) {
  const updateSettings = useUpdateProjectSettings(projectId);

  const { control, register, handleSubmit, watch } = useForm({
    defaultValues: {
      columns: initialColumns.sort((a, b) => a.order - b.order),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'columns',
  });

  const onSubmit = async (data: { columns: Column[] }) => {
    const columnsWithOrder = data.columns.map((col, index) => ({
      ...col,
      order: index,
    }));

    await updateSettings.mutateAsync({ columns: columnsWithOrder });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">Workflow Columns</h3>
          <p className="text-sm text-gray-500">
            Configure the columns for your Kanban board. Drag to reorder.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3"
              >
                <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />

                <input
                  type="hidden"
                  {...register(`columns.${index}.id`)}
                  value={field.id}
                />

                <input
                  type="hidden"
                  {...register(`columns.${index}.order`)}
                  value={index}
                />

                <Input
                  {...register(`columns.${index}.name`)}
                  placeholder="Column name"
                  className="flex-1"
                />

                <Input
                  {...register(`columns.${index}.wipLimit`, {
                    valueAsNumber: true,
                  })}
                  type="number"
                  placeholder="WIP Limit"
                  className="w-24"
                />

                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-2 text-gray-400 hover:text-danger-500"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                append({
                  id: `col-${Date.now()}`,
                  name: '',
                  order: fields.length,
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={updateSettings.isPending}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
