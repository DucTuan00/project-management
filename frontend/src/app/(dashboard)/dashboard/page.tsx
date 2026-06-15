'use client';

import React from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { useAuth } from '@/providers/auth-provider';
import { useWorkspaces } from '@/modules/workspace/queries';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: workspaces, isLoading } = useWorkspaces();

  const stats = [
    { name: 'Total Projects', value: '-', icon: FolderKanban, color: '#ff4f00', bg: '#fff7ed' },
    { name: 'Tasks Completed', value: '-', icon: CheckCircle, color: '#16a34a', bg: '#dcfce7' },
    { name: 'In Progress', value: '-', icon: Clock, color: '#d97706', bg: '#fef3c7' },
    { name: 'Overdue Tasks', value: '-', icon: AlertCircle, color: '#dc2626', bg: '#fee2e2' },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.displayName?.split(' ')[0] || 'there'}!`}
        description="Here's an overview of your projects and tasks."
        actions={
          <Link href="/workspace">
            <Button>
              <Plus size={16} style={{ marginRight: '8px' }} />
              New Workspace
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          mb: 4,
        }}
      >
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#939084', fontSize: '14px' }}>
                    {stat.name}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: '#201515',
                      mt: 0.5,
                      fontSize: '30px',
                    }}
                  >
                    {stat.value}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    borderRadius: '12px',
                    p: 1.5,
                    backgroundColor: stat.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <stat.icon style={{ fontSize: '24px', color: stat.color }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Recent Workspaces */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
        }}
      >
        <Card>
          <CardHeader>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#201515', fontSize: '18px' }}>
                Your Workspaces
              </Typography>
              <Link
                href="/workspace"
                style={{
                  fontSize: '14px',
                  color: '#ff4f00',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                View all
                <ArrowRight size={16} style={{ marginLeft: '4px' }} />
              </Link>
            </Box>
          </CardHeader>
          <CardContent>
            {isLoading ? (
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
            ) : workspaces && workspaces.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {workspaces.slice(0, 5).map((workspace) => (
                  <Link
                    key={workspace.id}
                    href={`/workspace/${workspace.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderRadius: '12px',
                        border: '1px solid #c5c0b1',
                        p: 1.5,
                        '&:hover': {
                          backgroundColor: '#f8f4f0',
                        },
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            backgroundColor: '#fff7ed',
                          }}
                        >
                          <FolderKanban style={{ color: '#ff4f00', fontSize: '20px' }} />
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              color: '#201515',
                              fontSize: '14px',
                            }}
                          >
                            {workspace.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#939084',
                              fontSize: '12px',
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '200px',
                            }}
                          >
                            {workspace.description || 'No description'}
                          </Typography>
                        </Box>
                      </Box>
                      <ArrowRight style={{ color: '#939084', fontSize: '18px' }} />
                    </Box>
                  </Link>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" sx={{ color: '#939084', mb: 2 }}>
                  No workspaces yet
                </Typography>
                <Link href="/workspace">
                  <Button variant="secondary" size="sm">
                    <Plus size={16} style={{ marginRight: '4px' }} />
                    Create Workspace
                  </Button>
                </Link>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#201515', fontSize: '18px' }}>
              Quick Actions
            </Typography>
          </CardHeader>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Link href="/workspace" style={{ textDecoration: 'none' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    borderRadius: '12px',
                    border: '1px solid #c5c0b1',
                    p: 2,
                    '&:hover': {
                      backgroundColor: '#f8f4f0',
                    },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: '#fff7ed',
                    }}
                  >
                    <Plus style={{ color: '#ff4f00', fontSize: '20px' }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#201515', fontSize: '14px' }}>
                      Create Workspace
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#939084', fontSize: '12px' }}>
                      Set up a new workspace for your team
                    </Typography>
                  </Box>
                </Box>
              </Link>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  borderRadius: '12px',
                  border: '1px solid #c5c0b1',
                  p: 2,
                  opacity: 0.5,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    backgroundColor: '#dcfce7',
                  }}
                >
                  <FolderKanban style={{ color: '#16a34a', fontSize: '20px' }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#201515', fontSize: '14px' }}>
                    Create Project
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#939084', fontSize: '12px' }}>
                    Start a new project in a workspace
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  borderRadius: '12px',
                  border: '1px solid #c5c0b1',
                  p: 2,
                  opacity: 0.5,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    backgroundColor: '#fef3c7',
                  }}
                >
                  <CheckCircle style={{ color: '#d97706', fontSize: '20px' }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#201515', fontSize: '14px' }}>
                    View Reports
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#939084', fontSize: '12px' }}>
                    Check your project analytics
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </div>
  );
}
