'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { WorkspaceForm } from '@/modules/workspace/components/workspace-form';
import { useWorkspace, useUpdateWorkspace } from '@/modules/workspace/queries';
import { useToast } from '@/components/ui/toast';
import { UpdateWorkspaceFormData } from '@/modules/workspace/schemas';

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { toast } = useToast();

  const { data: workspace, isLoading } = useWorkspace(workspaceId);
  const updateWorkspace = useUpdateWorkspace();

  const handleUpdate = async (data: UpdateWorkspaceFormData) => {
    try {
      await updateWorkspace.mutateAsync({ id: workspaceId, data });
      toast('Workspace updated successfully', 'success');
    } catch (error) {
      toast('Failed to update workspace', 'error');
    }
  };

  if (isLoading || !workspace) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Workspace Settings"
        description="Manage your workspace settings and preferences"
        breadcrumbs={[
          { label: 'Workspaces', href: '/workspace' },
          { label: workspace.name, href: `/workspace/${workspaceId}` },
          { label: 'Settings' },
        ]}
      />

      <div className="max-w-2xl">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            General Settings
          </h3>
          <WorkspaceForm
            mode="edit"
            initialData={{
              name: workspace.name,
              description: workspace.description,
            }}
            onSubmit={handleUpdate}
            isLoading={updateWorkspace.isPending}
          />
        </div>
      </div>
    </div>
  );
}
