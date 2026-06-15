'use client';

import React from 'react';
import { Search, LogOut, User, Settings } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown } from '@/components/ui/dropdown';
import { useAuth } from '@/providers/auth-provider';
import { NotificationDropdown } from '@/modules/notification/components/notification-dropdown';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();

  const userMenuItems = [
    {
      label: 'Profile',
      icon: <User size={16} />,
      onClick: () => {},
    },
    {
      label: 'Settings',
      icon: <Settings size={16} />,
      onClick: () => {},
    },
    {
      label: 'Logout',
      icon: <LogOut size={16} />,
      onClick: logout,
      danger: true,
    },
  ];

  return (
    <MuiAppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: '#fffefb',
        borderBottom: '1px solid #c5c0b1',
        color: '#201515',
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          minHeight: '64px',
          px: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {title && (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#201515',
                fontSize: '18px',
              }}
            >
              {title}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Search */}
          <Box
            sx={{
              position: 'relative',
              display: { xs: 'none', md: 'block' },
            }}
          >
            <Search
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#939084',
                fontSize: '18px',
              }}
            />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 rounded-lg border border-mute bg-canvas-soft py-2 pl-10 pr-4 text-sm text-ink placeholder:text-body-mid focus:border-primary focus:bg-canvas focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Box>

          {/* Notifications */}
          <NotificationDropdown />

          {/* User menu */}
          {user && (
            <Dropdown
              trigger={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
                  <Avatar name={user.displayName} size="sm" />
                  <Typography
                    variant="body2"
                    sx={{
                      display: { xs: 'none', md: 'block' },
                      fontWeight: 500,
                      color: '#605d52',
                      fontSize: '14px',
                    }}
                  >
                    {user.displayName}
                  </Typography>
                </Box>
              }
              items={userMenuItems}
              align="right"
            />
          )}
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
}
