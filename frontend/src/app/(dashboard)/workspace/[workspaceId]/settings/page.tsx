'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
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
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress sx={{ color: '#ff4f00' }} />
      </Box>
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

      <Box sx={{ maxWidth: '672px' }}>
        <Box
          sx={{
            borderRadius: '12px',
            border: '1px solid #c5c0b1',
            backgroundColor: '#fffefb',
            p: 3,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 500,
              color: '#201515',
              fontSize: '18px',
              mb: 2,
            }}
          >
            General Settings
          </Typography>
          <WorkspaceForm
            mode="edit"
            initialData={{
              name: workspace.name,
              description: workspace.description,
            }}
            onSubmit={handleUpdate}
            isLoading={updateWorkspace.isPending}
          />
        </Box>
      </Box>
    </div>
  );
}
