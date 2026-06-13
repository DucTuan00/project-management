'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/shared/page-header';
import { WorkspaceList } from '@/modules/workspace/components/workspace-list';
import { WorkspaceForm } from '@/modules/workspace/components/workspace-form';
import { useWorkspaces, useCreateWorkspace } from '@/modules/workspace/queries';
import { useToast } from '@/components/ui/toast';
import { CreateWorkspaceFormData } from '@/modules/workspace/schemas';

export default function WorkspacesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();

  const { data: workspaces, isLoading } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();

  const handleCreate = async (data: CreateWorkspaceFormData) => {
    try {
      await createWorkspace.mutateAsync(data);
      setIsCreateOpen(false);
      toast('Workspace created successfully', 'success');
    } catch (error) {
      toast('Failed to create workspace', 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Workspaces"
        description="Manage your workspaces"
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Workspace
          </Button>
        }
      />

      <WorkspaceList
        workspaces={workspaces || []}
        isLoading={isLoading}
        onCreateWorkspace={() => setIsCreateOpen(true)}
      />

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Workspace"
      >
        <WorkspaceForm
          mode="create"
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          isLoading={createWorkspace.isPending}
        />
      </Modal>
    </div>
  );
}
