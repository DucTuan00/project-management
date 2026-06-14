'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  showOnline?: boolean;
  isOnline?: boolean;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = 'md', showOnline = false, isOnline = false, ...props }, ref) => {
    const sizeStyles = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
    };

    const initials = getInitials(name);

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full bg-primary-100 text-primary-700 font-medium overflow-hidden',
          sizeStyles[size],
          className
        )}
        title={name}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt || name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
        {showOnline && (
          <span
            className={cn(
              'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white',
              isOnline ? 'bg-success-500' : 'bg-gray-300'
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// AvatarGroup component for displaying multiple avatars
interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: Array<{ src?: string | null; name: string }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, avatars, max = 3, size = 'md', ...props }, ref) => {
    const sizeStyles = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
    };

    const visibleAvatars = avatars.slice(0, max);
    const remainingCount = avatars.length - max;

    return (
      <div ref={ref} className={cn('flex -space-x-2', className)} {...props}>
        {visibleAvatars.map((avatar, index) => (
          <Avatar
            key={index}
            src={avatar.src}
            name={avatar.name}
            size={size}
            className={cn(
              'ring-2 ring-white',
              sizeStyles[size]
            )}
          />
        ))}
        {remainingCount > 0 && (
          <div
            className={cn(
              'inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-medium ring-2 ring-white',
              sizeStyles[size]
            )}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

export { Avatar, AvatarGroup };
