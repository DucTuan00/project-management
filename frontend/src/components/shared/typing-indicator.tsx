'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SxProps, Theme } from '@mui/material/styles';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  users: Array<{ userId: string; displayName: string }>;
  className?: string;
  sx?: SxProps<Theme>;
}

export function TypingIndicator({ users, className, sx }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const text =
    users.length === 1
      ? `${users[0].displayName} is typing`
      : users.length === 2
        ? `${users[0].displayName} and ${users[1].displayName} are typing`
        : `${users[0].displayName} and ${users.length - 1} others are typing`;

  return (
    <Box
      className={cn(className)}
      sx={[
        {
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Box
          sx={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#939084',
            animation: 'bounce 1s infinite',
            animationDelay: '-0.3s',
          }}
        />
        <Box
          sx={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#939084',
            animation: 'bounce 1s infinite',
            animationDelay: '-0.15s',
          }}
        />
        <Box
          sx={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#939084',
            animation: 'bounce 1s infinite',
          }}
        />
      </Box>
      <Typography
        variant="body2"
        sx={{
          color: '#939084',
          fontSize: '14px',
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}
