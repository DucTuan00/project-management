'use client';

import React from 'react';
import Link from 'next/link';
import { FolderKanban, MoreHorizontal, Trash2, Settings } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dropdown } from '@/components/ui/dropdown';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Project } from '../types';
import { formatDate } from '@/lib/utils';

interface ProjectListProps {
  projects: Project[];
  workspaceId: string;
  isLoading?: boolean;
  onCreateProject?: () => void;
  onDeleteProject?: (projectId: string) => void;
}

export function ProjectList({
  projects,
  workspaceId,
  isLoading,
  onCreateProject,
  onDeleteProject,
}: ProjectListProps) {
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Skeleton variant="rectangular" width={48} height={48} sx={{ borderRadius: '12px' }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="50%" height={20} />
                  <Skeleton variant="text" width="25%" height={16} />
                </Box>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Skeleton variant="text" width="75%" height={14} />
                <Skeleton variant="text" width="50%" height={14} />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        description="Create a project to start organizing your work."
        action={
          onCreateProject
            ? { label: 'Create Project', onClick: onCreateProject }
            : undefined
        }
      />
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
      }}
    >
      {projects.map((project) => (
        <Card
          key={project.id}
          sx={{
            '&:hover': { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
            transition: 'box-shadow 0.2s',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Link
                href={`/project/${project.id}`}
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'flex-start', gap: '16px' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#fff7ed',
                    flexShrink: 0,
                  }}
                >
                  <FolderKanban style={{ color: '#ff4f00', fontSize: '24px' }} />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: '#201515',
                      fontSize: '18px',
                      '&:hover': { color: '#ff4f00' },
                      transition: 'color 0.2s',
                    }}
                  >
                    {project.name}
                  </Typography>
                  <Badge variant="default">{project.key}</Badge>
                </Box>
              </Link>

              <Dropdown
                trigger={
                  <Box
                    component="button"
                    sx={{
                      p: 0.5,
                      color: '#939084',
                      '&:hover': { color: '#605d52' },
                      transition: 'color 0.2s',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <MoreHorizontal size={20} />
                  </Box>
                }
                items={[
                  {
                    label: 'Settings',
                    icon: <Settings size={16} />,
                    onClick: () => {},
                  },
                  {
                    label: 'Delete',
                    icon: <Trash2 size={16} />,
                    onClick: () => onDeleteProject?.(project.id),
                    danger: true,
                  },
                ]}
                align="right"
              />
            </Box>

            <Typography
              variant="body2"
              sx={{
                mt: 2,
                color: '#939084',
                fontSize: '14px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {project.description || 'No description'}
            </Typography>

            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, fontSize: '12px' }}>
              <Badge variant={project.status === 'active' ? 'success' : 'default'}>
                {project.status}
              </Badge>
              <Typography variant="caption" sx={{ color: '#939084' }}>
                Created {formatDate(project.createdAt)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
