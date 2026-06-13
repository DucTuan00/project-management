'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FolderKanban, Settings, ListTodo, Columns } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { useProject } from '@/modules/project/queries';
import { useTasks } from '@/modules/task/queries';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: tasks, isLoading: tasksLoading } = useTasks(projectId);

  if (projectLoading || !project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const taskStats = {
    total: tasks?.length || 0,
    todo: tasks?.filter((t) => t.status === 'todo').length || 0,
    inProgress: tasks?.filter((t) => t.status === 'in_progress').length || 0,
    done: tasks?.filter((t) => t.status === 'done').length || 0,
  };

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.description || 'Project overview'}
        breadcrumbs={[
          { label: 'Workspaces', href: '/workspace' },
          { label: project.name },
        ]}
        actions={
          <Button
            variant="secondary"
            onClick={() => router.push(`/project/${projectId}/settings`)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        }
      />

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Link href={`/project/${projectId}/board`}>
          <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                  <Columns className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Board</h3>
                  <p className="text-sm text-gray-500">Kanban board view</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/project/${projectId}/backlog`}>
          <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success-100">
                  <ListTodo className="h-6 w-6 text-success-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Backlog</h3>
                  <p className="text-sm text-gray-500">List view of all tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/project/${projectId}/settings`}>
          <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning-100">
                  <Settings className="h-6 w-6 text-warning-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                  <p className="text-sm text-gray-500">Configure project settings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Task Statistics */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{taskStats.total}</p>
              <p className="text-sm text-gray-500">Total Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{taskStats.todo}</p>
              <p className="text-sm text-gray-500">To Do</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600">{taskStats.inProgress}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{taskStats.done}</p>
              <p className="text-sm text-gray-500">Done</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
