'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ProjectForm } from '@/modules/project/components/project-form';
import { ProjectSettingsForm } from '@/modules/project/components/project-settings-form';
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
  useProjectSettings,
} from '@/modules/project/queries';
import { useToast } from '@/components/ui/toast';
import { UpdateProjectFormData } from '@/modules/project/schemas';

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { toast } = useToast();

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: settings, isLoading: settingsLoading } = useProjectSettings(projectId);
  const updateProject = useUpdateProject(projectId);
  const deleteProject = useDeleteProject(projectId);

  const handleUpdateProject = async (data: UpdateProjectFormData) => {
    try {
      await updateProject.mutateAsync(data);
      toast('Project updated successfully', 'success');
    } catch (error) {
      toast('Failed to update project', 'error');
    }
  };

  const handleDeleteProject = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete this project? This action cannot be undone and will delete all tasks.'
      )
    ) {
      try {
        await deleteProject.mutateAsync();
        toast('Project deleted successfully', 'success');
        router.push('/workspace');
      } catch (error) {
        toast('Failed to delete project', 'error');
      }
    }
  };

  if (projectLoading || !project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Project Settings"
        description="Configure your project settings"
        breadcrumbs={[
          { label: 'Workspaces', href: '/workspace' },
          { label: project.name, href: `/project/${projectId}` },
          { label: 'Settings' },
        ]}
      />

      <div className="max-w-3xl space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">General</h3>
            <p className="text-sm text-gray-500">Update your project details</p>
          </CardHeader>
          <CardContent>
            <ProjectForm
              mode="edit"
              initialData={{
                name: project.name,
                description: project.description,
              }}
              onSubmit={handleUpdateProject}
              isLoading={updateProject.isPending}
            />
          </CardContent>
        </Card>

        {/* Workflow Settings */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Workflow</h3>
            <p className="text-sm text-gray-500">
              Configure your Kanban board columns
            </p>
          </CardHeader>
          <CardContent>
            {settingsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <ProjectSettingsForm
                projectId={projectId}
                columns={settings?.columns || []}
              />
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-danger-200">
          <CardHeader>
            <h3 className="text-lg font-medium text-danger-600">Danger Zone</h3>
            <p className="text-sm text-gray-500">
              Irreversible and destructive actions
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Delete Project</p>
                <p className="text-sm text-gray-500">
                  Once you delete a project, there is no going back. All tasks will be
                  permanently deleted.
                </p>
              </div>
              <Button
                variant="danger"
                onClick={handleDeleteProject}
                loading={deleteProject.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
