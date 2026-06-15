'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { cn } from '@/lib/utils';
import { useWorkspaces } from '@/modules/workspace/queries';

interface WorkspaceSwitcherProps {
  currentWorkspaceId?: string;
}

export function WorkspaceSwitcher({ currentWorkspaceId }: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: workspaces, isLoading } = useWorkspaces();

  const currentWorkspace = workspaces?.find(
    (w) => w.id === currentWorkspaceId
  );

  return (
    <ClickAwayListener onClickAway={() => setIsOpen(false)}>
      <Box sx={{ position: 'relative' }}>
        <Box
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            width: '100%',
            borderRadius: '12px',
            border: '1px solid #c5c0b1',
            backgroundColor: '#fffefb',
            p: 1.5,
            cursor: 'pointer',
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
            <Building2 sx={{ color: '#ff4f00', fontSize: '20px' }} />
          </Box>
          <Box sx={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: '#201515',
                fontSize: '14px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {currentWorkspace?.name || 'Select Workspace'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#939084',
                fontSize: '12px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {currentWorkspace?.description || 'No workspace selected'}
            </Typography>
          </Box>
          <ChevronsUpDown style={{ color: '#939084', fontSize: '18px' }} />
        </Box>

        {isOpen && (
          <Paper
            elevation={0}
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '100%',
              zIndex: 50,
              mt: 1,
              borderRadius: '12px',
              border: '1px solid #c5c0b1',
              backgroundColor: '#fffefb',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Box sx={{ p: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  px: 1.5,
                  py: 1,
                  display: 'block',
                  fontWeight: 500,
                  color: '#939084',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Workspaces
              </Typography>
              {isLoading ? (
                <Box sx={{ px: 1.5, py: 2, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#939084', fontSize: '14px' }}>
                    Loading...
                  </Typography>
                </Box>
              ) : (
                <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                  {workspaces?.map((workspace) => (
                    <Box component="li" key={workspace.id}>
                      <Link
                        href={`/workspace/${workspace.id}`}
                        onClick={() => setIsOpen(false)}
                        style={{ textDecoration: 'none' }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            borderRadius: '12px',
                            px: 1.5,
                            py: 1,
                            backgroundColor:
                              workspace.id === currentWorkspaceId
                                ? '#fff7ed'
                                : 'transparent',
                            color:
                              workspace.id === currentWorkspaceId
                                ? '#ff4f00'
                                : '#605d52',
                            '&:hover': {
                              backgroundColor:
                                workspace.id === currentWorkspaceId
                                  ? '#fff7ed'
                                  : '#f8f4f0',
                            },
                            transition: 'background-color 0.2s',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '12px',
                              backgroundColor: '#fff7ed',
                            }}
                          >
                            <Building2 sx={{ color: '#ff4f00', fontSize: '16px' }} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                fontSize: '14px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {workspace.name}
                            </Typography>
                          </Box>
                          {workspace.id === currentWorkspaceId && (
                            <Check style={{ color: '#ff4f00', fontSize: '16px' }} />
                          )}
                        </Box>
                      </Link>
                    </Box>
                  ))}
                </Box>
              )}
              <Box
                sx={{
                  borderTop: '1px solid #c5c0b1',
                  mt: 1,
                  pt: 1,
                }}
              >
                <Link
                  href="/workspace/new"
                  onClick={() => setIsOpen(false)}
                  style={{ textDecoration: 'none' }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      borderRadius: '12px',
                      px: 1.5,
                      py: 1,
                      color: '#605d52',
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
                        width: '32px',
                        height: '32px',
                        borderRadius: '12px',
                        border: '2px dashed #c5c0b1',
                      }}
                    >
                      <Plus style={{ color: '#939084', fontSize: '16px' }} />
                    </Box>
                    <Typography variant="body2" sx={{ fontSize: '14px' }}>
                      Create Workspace
                    </Typography>
                  </Box>
                </Link>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
}
