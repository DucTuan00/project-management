'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { TaskDetail } from '@/modules/task/components/task-detail';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { useTask } from '@/modules/task/queries';
import { useProject, useProjectMembers } from '@/modules/project/queries';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const taskId = params.taskId as string;

  const { data: task, isLoading: taskLoading } = useTask(taskId);
  const { data: project } = useProject(projectId);
  const { data: members } = useProjectMembers(projectId);

  if (taskLoading) {
    return <LoadingPage message="Loading task..." />;
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Task not found</h2>
        <p className="text-gray-500 mb-4">The task you're looking for doesn't exist.</p>
        <Button onClick={() => router.push(`/project/${projectId}`)}>
          Back to Project
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title=""
        breadcrumbs={[
          { label: 'Workspaces', href: '/workspace' },
          { label: project?.name || 'Project', href: `/project/${projectId}` },
          { label: `${project?.key}-${task.id.slice(-4).toUpperCase()}` },
        ]}
        actions={
          <Button
            variant="ghost"
            onClick={() => router.push(`/project/${projectId}/board`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Board
          </Button>
        }
      />

      <div className="max-w-4xl">
        <TaskDetail
          task={task}
          projectKey={project?.key || 'PRJ'}
          members={members?.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            avatar: m.user.avatar,
          }))}
        />
      </div>
    </div>
  );
}
