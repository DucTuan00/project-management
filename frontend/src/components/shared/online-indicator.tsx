'use client';

import React from 'react';
import Box from '@mui/material/Box';
import { cn } from '@/lib/utils';

interface OnlineIndicatorProps {
  isOnline: boolean;
  className?: string;
}

export function OnlineIndicator({ isOnline, className }: OnlineIndicatorProps) {
  return (
    <Box
      className={cn(className)}
      sx={{
        display: 'inline-block',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        border: '2px solid #fffefb',
        backgroundColor: isOnline ? '#22c55e' : '#c5c0b1',
      }}
    />
  );
}
