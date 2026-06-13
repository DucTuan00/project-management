'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal, ModalActions } from '@/components/ui/modal';
import { PageHeader } from '@/components/shared/page-header';
import { ProjectList } from '@/modules/project/components/project-list';
import { ProjectForm } from '@/modules/project/components/project-form';
import { useProjects, useCreateProject, useDeleteProject } from '@/modules/project/queries';
import { useWorkspace } from '@/modules/workspace/queries';
import { useToast } from '@/components/ui/toast';
import { CreateProjectFormData } from '@/modules/project/schemas';

export default function WorkspacePage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();

  const { data: workspace } = useWorkspace(workspaceId);
  const { data: projects, isLoading } = useProjects(workspaceId);
  const createProject = useCreateProject(workspaceId);
  const deleteProject = useDeleteProject(workspaceId);

  const handleCreateProject = async (data: CreateProjectFormData) => {
    try {
      await createProject.mutateAsync(data as any);
      setIsCreateOpen(false);
      toast('Project created successfully', 'success');
    } catch (error) {
      toast('Failed to create project', 'error');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject.mutateAsync(projectId);
        toast('Project deleted successfully', 'success');
      } catch (error) {
        toast('Failed to delete project', 'error');
      }
    }
  };

  return (
    <div>
      <PageHeader
        title={workspace?.name || 'Workspace'}
        description={workspace?.description || 'Manage your projects'}
        breadcrumbs={[
          { label: 'Workspaces', href: '/workspace' },
          { label: workspace?.name || 'Workspace' },
        ]}
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        }
      />

      <ProjectList
        projects={projects || []}
        workspaceId={workspaceId}
        isLoading={isLoading}
        onCreateProject={() => setIsCreateOpen(true)}
        onDeleteProject={handleDeleteProject}
      />

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Project"
      >
        <ProjectForm
          mode="create"
          onSubmit={handleCreateProject}
          onCancel={() => setIsCreateOpen(false)}
          isLoading={createProject.isPending}
        />
      </Modal>
    </div>
  );
}
