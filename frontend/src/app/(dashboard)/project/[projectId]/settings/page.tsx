'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
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
        title="Project Settings"
        description="Configure your project settings"
        breadcrumbs={[
          { label: 'Workspaces', href: '/workspace' },
          { label: project.name, href: `/project/${projectId}` },
          { label: 'Settings' },
        ]}
      />

      <Box sx={{ maxWidth: '768px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* General Settings */}
        <Card>
          <CardHeader>
            <Typography variant="h6" sx={{ fontWeight: 500, color: '#201515', fontSize: '18px' }}>
              General
            </Typography>
            <Typography variant="body2" sx={{ color: '#939084', fontSize: '14px' }}>
              Update your project details
            </Typography>
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
            <Typography variant="h6" sx={{ fontWeight: 500, color: '#201515', fontSize: '18px' }}>
              Workflow
            </Typography>
            <Typography variant="body2" sx={{ color: '#939084', fontSize: '14px' }}>
              Configure your Kanban board columns
            </Typography>
          </CardHeader>
          <CardContent>
            {settingsLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[1, 2, 3].map((i) => (
                  <Box
                    key={i}
                    sx={{
                      height: '48px',
                      backgroundColor: '#f8f4f0',
                      borderRadius: '12px',
                      animation: 'pulse 2s infinite',
                    }}
                  />
                ))}
              </Box>
            ) : (
              <ProjectSettingsForm
                projectId={projectId}
                columns={settings?.columns || []}
              />
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card sx={{ borderColor: '#fecaca' }}>
          <CardHeader>
            <Typography variant="h6" sx={{ fontWeight: 500, color: '#dc2626', fontSize: '18px' }}>
              Danger Zone
            </Typography>
            <Typography variant="body2" sx={{ color: '#939084', fontSize: '14px' }}>
              Irreversible and destructive actions
            </Typography>
          </CardHeader>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500, color: '#201515' }}>
                  Delete Project
                </Typography>
                <Typography variant="body2" sx={{ color: '#939084', fontSize: '14px' }}>
                  Once you delete a project, there is no going back. All tasks will be
                  permanently deleted.
                </Typography>
              </Box>
              <Button
                variant="danger"
                onClick={handleDeleteProject}
                loading={deleteProject.isPending}
              >
                <Trash2 size={16} style={{ marginRight: '8px' }} />
                Delete Project
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </div>
  );
}
