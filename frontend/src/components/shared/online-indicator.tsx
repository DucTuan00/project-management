'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface OnlineIndicatorProps {
  isOnline: boolean;
  className?: string;
}

export function OnlineIndicator({ isOnline, className }: OnlineIndicatorProps) {
  return (
    <span
      className={cn(
        'inline-block h-2.5 w-2.5 rounded-full border-2 border-white',
        isOnline ? 'bg-success-500' : 'bg-gray-300',
        className
      )}
    />
  );
}
