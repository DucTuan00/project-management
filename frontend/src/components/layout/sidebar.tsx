'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
} from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { cn } from '@/lib/utils';

interface SidebarProps {
  workspaceId?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/workspace', icon: FolderKanban },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ workspaceId }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const getHref = (item: (typeof navigation)[0]) => {
    if (workspaceId) {
      if (item.name === 'Projects') {
        return `/workspace/${workspaceId}/projects`;
      }
      if (item.name === 'Members') {
        return `/workspace/${workspaceId}/members`;
      }
      if (item.name === 'Settings') {
        return `/workspace/${workspaceId}/settings`;
      }
    }
    return item.href;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: collapsed ? '64px' : '256px',
        backgroundColor: '#fffefb',
        borderRight: '1px solid #c5c0b1',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
          px: 2,
          borderBottom: '1px solid #c5c0b1',
        }}
      >
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '12px',
                backgroundColor: '#ff4f00',
              }}
            >
              <Home style={{ color: '#fffefb', fontSize: '20px' }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: '#201515',
                fontSize: '18px',
              }}
            >
              PM Platform
            </Typography>
          </Link>
        )}
        <IconButton
          onClick={() => setCollapsed(!collapsed)}
          sx={{
            color: '#939084',
            '&:hover': {
              backgroundColor: '#f8f4f0',
              color: '#605d52',
            },
          }}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>

      {/* Navigation */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 1.5,
          py: 2,
        }}
      >
        {navigation.map((item) => {
          const href = getHref(item);
          const isActive = pathname === href || pathname.startsWith(href + '/');

          return (
            <ListItemButton
              key={item.name}
              component={Link}
              href={href}
              title={collapsed ? item.name : undefined}
              sx={{
                borderRadius: '12px',
                mb: 0.5,
                px: 1.5,
                py: 1,
                backgroundColor: isActive ? '#fff7ed' : 'transparent',
                color: isActive ? '#ff4f00' : '#605d52',
                '&:hover': {
                  backgroundColor: isActive ? '#fff7ed' : '#f8f4f0',
                  color: isActive ? '#ff4f00' : '#201515',
                },
                '& .MuiListItemIcon-root': {
                  color: isActive ? '#ff4f00' : '#939084',
                  minWidth: '40px',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: '40px' }}>
                <item.icon style={{ fontSize: '20px' }} />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={item.name}
                  primaryTypographyProps={{
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                />
              )}
            </ListItemButton>
          );
        })}
      </Box>

      {/* Footer */}
      <Divider sx={{ borderColor: '#c5c0b1' }} />
      <Box sx={{ p: 2 }}>
        {!collapsed && (
          <Box
            sx={{
              borderRadius: '12px',
              backgroundColor: '#f8f4f0',
              p: 1.5,
            }}
          >
            <Typography variant="caption" sx={{ color: '#939084' }}>
              Version 0.1.0
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
