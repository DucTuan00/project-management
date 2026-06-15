'use client';

import React from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Workspace } from '../types';
import { formatDate } from '@/lib/utils';

interface WorkspaceListProps {
  workspaces: Workspace[];
  isLoading?: boolean;
  onCreateWorkspace?: () => void;
}

export function WorkspaceList({
  workspaces,
  isLoading,
  onCreateWorkspace,
}: WorkspaceListProps) {
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
                  <Skeleton variant="text" width="75%" height={16} />
                </Box>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="text" width={80} height={14} />
                <Skeleton variant="text" width={80} height={14} />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  if (workspaces.length === 0) {
    return (
      <EmptyState
        title="No workspaces yet"
        description="Create a workspace to get started with your projects."
        action={
          onCreateWorkspace
            ? { label: 'Create Workspace', onClick: onCreateWorkspace }
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
      {workspaces.map((workspace) => (
        <Link key={workspace.id} href={`/workspace/${workspace.id}`} style={{ textDecoration: 'none' }}>
          <Card
            sx={{
              cursor: 'pointer',
              height: '100%',
              '&:hover': { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
              transition: 'box-shadow 0.2s',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
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
                  <Building2 style={{ color: '#ff4f00', fontSize: '24px' }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: '#201515',
                      fontSize: '18px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {workspace.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.5,
                      color: '#939084',
                      fontSize: '14px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {workspace.description || 'No description'}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, color: '#939084', fontSize: '14px' }}>
                <Typography variant="body2" sx={{ color: '#939084', fontSize: '14px' }}>
                  Created {formatDate(workspace.createdAt)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Link>
      ))}
    </Box>
  );
}
