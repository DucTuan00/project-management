'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  users: Array<{ userId: string; displayName: string }>;
  className?: string;
}

export function TypingIndicator({ users, className }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const text =
    users.length === 1
      ? `${users[0].displayName} is typing`
      : users.length === 2
        ? `${users[0].displayName} and ${users[1].displayName} are typing`
        : `${users[0].displayName} and ${users.length - 1} others are typing`;

  return (
    <div className={cn('flex items-center gap-2 text-sm text-gray-500', className)}>
      <div className="flex gap-0.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
      </div>
      <span>{text}</span>
    </div>
  );
}
