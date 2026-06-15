'use client';

import React from 'react';
import { Inbox } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Box
      className={cn(className)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          borderRadius: '50%',
          backgroundColor: '#f8f4f0',
          p: 2.5,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon || <Inbox sx={{ fontSize: '32px', color: '#939084' }} />}
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 500,
          color: '#201515',
          fontSize: '18px',
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            color: '#939084',
            fontSize: '14px',
            maxWidth: '400px',
          }}
        >
          {description}
        </Typography>
      )}
      {action && (
        <Box sx={{ mt: 3 }}>
          <Button onClick={action.onClick}>{action.label}</Button>
        </Box>
      )}
    </Box>
  );
}
