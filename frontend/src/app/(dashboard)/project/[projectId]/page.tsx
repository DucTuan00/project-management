'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FolderKanban, Settings, ListTodo, Columns } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
            <Settings size={16} style={{ marginRight: '8px' }} />
            Settings
          </Button>
        }
      />

      {/* Quick Actions */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          mb: 4,
        }}
      >
        <Link href={`/project/${projectId}/board`} style={{ textDecoration: 'none' }}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }, transition: 'box-shadow 0.2s', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#fff7ed',
                  }}
                >
                  <Columns style={{ color: '#ff4f00', fontSize: '24px' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#201515', fontSize: '18px' }}>
                    Board
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#939084', fontSize: '14px' }}>
                    Kanban board view
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/project/${projectId}/backlog`} style={{ textDecoration: 'none' }}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }, transition: 'box-shadow 0.2s', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#dcfce7',
                  }}
                >
                  <ListTodo style={{ color: '#16a34a', fontSize: '24px' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#201515', fontSize: '18px' }}>
                    Backlog
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#939084', fontSize: '14px' }}>
                    List view of all tasks
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/project/${projectId}/settings`} style={{ textDecoration: 'none' }}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }, transition: 'box-shadow 0.2s', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#fef3c7',
                  }}
                >
                  <Settings style={{ color: '#d97706', fontSize: '24px' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#201515', fontSize: '18px' }}>
                    Settings
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#939084', fontSize: '14px' }}>
                    Configure project settings
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Link>
      </Box>

      {/* Task Statistics */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#201515', fontSize: '18px', mb: 2 }}>
            Task Overview
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#201515', fontSize: '30px' }}>
                {taskStats.total}
              </Typography>
              <Typography variant="body2" sx={{ color: '#939084', fontSize: '14px' }}>
                Total Tasks
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6', fontSize: '30px' }}>
                {taskStats.todo}
              </Typography>
              <Typography variant="body2" sx={{ color: '#939084', fontSize: '14px' }}>
                To Do
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b', fontSize: '30px' }}>
                {taskStats.inProgress}
              </Typography>
              <Typography variant="body2" sx={{ color: '#939084', fontSize: '14px' }}>
                In Progress
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#22c55e', fontSize: '30px' }}>
                {taskStats.done}
              </Typography>
              <Typography variant="body2" sx={{ color: '#939084', fontSize: '14px' }}>
                Done
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </div>
  );
}
