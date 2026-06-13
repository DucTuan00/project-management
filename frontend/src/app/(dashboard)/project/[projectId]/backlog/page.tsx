'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/shared/page-header';
import { TaskList } from '@/modules/task/components/task-list';
import { TaskForm } from '@/modules/task/components/task-form';
import { useProject } from '@/modules/project/queries';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/modules/task/queries';
import { useToast } from '@/components/ui/toast';
import { Task } from '@/modules/task/types';
import { CreateTaskFormData, UpdateTaskFormData } from '@/modules/task/schemas';

export default function ProjectBacklogPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { toast } = useToast();

  const { data: project } = useProject(projectId);
  const { data: tasks, isLoading } = useTasks(projectId);
  const createTask = useCreateTask(projectId);
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);

  const handleCreateTask = async (data: CreateTaskFormData) => {
    try {
      await createTask.mutateAsync({
        ...data,
        projectId,
      } as any);
      setIsCreateOpen(false);
      toast('Task created successfully', 'success');
    } catch (error) {
      toast('Failed to create task', 'error');
    }
  };

  const handleUpdateTask = async (data: UpdateTaskFormData) => {
    if (!editingTask) return;
    try {
      await updateTask.mutateAsync({ taskId: editingTask.id, data });
      setEditingTask(null);
      toast('Task updated successfully', 'success');
    } catch (error) {
      toast('Failed to update task', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask.mutateAsync(taskId);
        toast('Task deleted successfully', 'success');
      } catch (error) {
        toast('Failed to delete task', 'error');
      }
    }
  };

  return (
    <div>
      <PageHeader
        title={`${project?.name || 'Project'} - Backlog`}
        description="Manage all tasks in this project"
        breadcrumbs={[
          { label: 'Workspaces', href: '/workspace' },
          { label: project?.name || 'Project', href: `/project/${projectId}` },
          { label: 'Backlog' },
        ]}
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        }
      />

      <TaskList
        tasks={tasks || []}
        projectKey={project?.key || 'PRJ'}
        isLoading={isLoading}
        onCreateTask={() => setIsCreateOpen(true)}
        onEditTask={(task) => setEditingTask(task)}
        onDeleteTask={handleDeleteTask}
      />

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Task"
        size="lg"
      >
        <TaskForm
          mode="create"
          onSubmit={handleCreateTask}
          onCancel={() => setIsCreateOpen(false)}
          isLoading={createTask.isPending}
        />
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Edit Task"
        size="lg"
      >
        {editingTask && (
          <TaskForm
            mode="edit"
            initialData={{
              title: editingTask.title,
              description: editingTask.description,
              type: editingTask.type,
              priority: editingTask.priority,
              status: editingTask.status,
              storyPoints: editingTask.storyPoints,
              dueDate: editingTask.dueDate,
            }}
            onSubmit={handleUpdateTask}
            onCancel={() => setEditingTask(null)}
            isLoading={updateTask.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
