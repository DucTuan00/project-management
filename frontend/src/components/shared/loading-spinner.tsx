'use client';

import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 16,
    md: 32,
    lg: 48,
  };

  return (
    <CircularProgress
      size={sizeMap[size]}
      sx={{
        color: '#ff4f00',
      }}
      className={cn(className)}
    />
  );
}

interface LoadingPageProps {
  message?: string;
}

export function LoadingPage({ message = 'Loading...' }: LoadingPageProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
      }}
    >
      <LoadingSpinner size="lg" />
      <Typography
        variant="body2"
        sx={{
          mt: 2,
          color: '#939084',
          fontSize: '14px',
        }}
      >
        {message}
      </Typography>
    </Box>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
}

export function LoadingOverlay({ isLoading, children }: LoadingOverlayProps) {
  return (
    <Box sx={{ position: 'relative' }}>
      {children}
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(255, 254, 251, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderRadius: '12px',
          }}
        >
          <LoadingSpinner />
        </Box>
      )}
    </Box>
  );
}
