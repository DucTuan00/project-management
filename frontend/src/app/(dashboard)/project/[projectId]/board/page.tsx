'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/shared/page-header';
import { KanbanBoard, KanbanBoardSkeleton } from '@/modules/kanban/components/kanban-board';
import { TaskForm } from '@/modules/task/components/task-form';
import { useProject, useProjectSettings } from '@/modules/project/queries';
import { useTaskBoard, useCreateTask } from '@/modules/task/queries';
import { useToast } from '@/components/ui/toast';
import { Task, TaskStatus } from '@/modules/task/types';
import { CreateTaskFormData } from '@/modules/task/schemas';
import { BoardColumn } from '@/modules/kanban/types';

export default function ProjectBoardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>('todo');
  const { toast } = useToast();

  const { data: project } = useProject(projectId);
  const { data: settings } = useProjectSettings(projectId);
  const { data: boardTasks, isLoading } = useTaskBoard(projectId);
  const createTask = useCreateTask(projectId);

  const handleCreateTask = async (data: CreateTaskFormData) => {
    try {
      await createTask.mutateAsync({
        ...data,
        projectId,
        status: selectedStatus,
      } as any);
      setIsCreateOpen(false);
      toast('Task created successfully', 'success');
    } catch (error) {
      toast('Failed to create task', 'error');
    }
  };

  const handleTaskClick = (task: Task) => {
    router.push(`/project/${projectId}/task/${task.id}`);
  };

  const handleAddTask = (status: TaskStatus) => {
    setSelectedStatus(status);
    setIsCreateOpen(true);
  };

  // Default columns if settings not loaded
  const defaultColumns: BoardColumn[] = [
    { id: 'backlog', name: 'Backlog', taskStatus: 'backlog', order: 0 },
    { id: 'todo', name: 'To Do', taskStatus: 'todo', order: 1 },
    { id: 'in_progress', name: 'In Progress', taskStatus: 'in_progress', order: 2 },
    { id: 'review', name: 'Review', taskStatus: 'review', order: 3 },
    { id: 'done', name: 'Done', taskStatus: 'done', order: 4 },
  ];

  const columns: BoardColumn[] = settings?.columns
    ? settings.columns.map((col) => ({
        ...col,
        taskStatus: col.id as TaskStatus,
      }))
    : defaultColumns;

  // Default empty board if no data
  const defaultTasks: Record<TaskStatus, Task[]> = {
    backlog: [],
    todo: [],
    in_progress: [],
    review: [],
    done: [],
    archived: [],
  };

  const tasks = boardTasks || defaultTasks;

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={`${project?.name || 'Project'} - Board`}
        description="Drag and drop tasks between columns"
        breadcrumbs={[
          { label: 'Workspaces', href: '/workspace' },
          { label: project?.name || 'Project', href: `/project/${projectId}` },
          { label: 'Board' },
        ]}
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        }
      />

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <KanbanBoardSkeleton />
        ) : (
          <KanbanBoard
            projectId={projectId}
            columns={columns}
            tasks={tasks}
            projectKey={project?.key || 'PRJ'}
            onTaskClick={handleTaskClick}
            onAddTask={handleAddTask}
          />
        )}
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Task"
        size="lg"
      >
        <TaskForm
          mode="create"
          initialData={{ status: selectedStatus }}
          onSubmit={handleCreateTask}
          onCancel={() => setIsCreateOpen(false)}
          isLoading={createTask.isPending}
        />
      </Modal>
    </div>
  );
}
