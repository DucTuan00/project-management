'use client';

import React from 'react';
import MuiAvatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
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
    const sizeMap = {
      sm: 32,
      md: 40,
      lg: 48,
    };

    const initials = getInitials(name);

    const avatar = (
      <MuiAvatar
        ref={ref}
        src={src || undefined}
        alt={alt || name}
        sx={{
          width: sizeMap[size],
          height: sizeMap[size],
          backgroundColor: '#fff7ed',
          color: '#ff4f00',
          fontSize: size === 'sm' ? '12px' : size === 'md' ? '14px' : '16px',
          fontWeight: 500,
        }}
        className={cn(className)}
        {...props}
      >
        {!src && initials}
      </MuiAvatar>
    );

    if (showOnline) {
      return (
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: isOnline ? '#22c55e' : '#c5c0b1',
              color: isOnline ? '#22c55e' : '#c5c0b1',
              boxShadow: '0 0 0 2px #fffefb',
              width: 10,
              height: 10,
              borderRadius: '50%',
            },
          }}
        >
          {avatar}
        </Badge>
      );
    }

    return avatar;
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
    const sizeMap = {
      sm: 32,
      md: 40,
      lg: 48,
    };

    const visibleAvatars = avatars.slice(0, max);
    const remainingCount = avatars.length - max;

    return (
      <div ref={ref} className={cn('flex -space-x-2', className)} {...props}>
        {visibleAvatars.map((avatar, index) => (
          <MuiAvatar
            key={index}
            src={avatar.src || undefined}
            sx={{
              width: sizeMap[size],
              height: sizeMap[size],
              backgroundColor: '#fff7ed',
              color: '#ff4f00',
              fontSize: size === 'sm' ? '12px' : size === 'md' ? '14px' : '16px',
              fontWeight: 500,
              border: '2px solid #fffefb',
            }}
          >
            {getInitials(avatar.name)}
          </MuiAvatar>
        ))}
        {remainingCount > 0 && (
          <MuiAvatar
            sx={{
              width: sizeMap[size],
              height: sizeMap[size],
              backgroundColor: '#f8f4f0',
              color: '#605d52',
              fontSize: size === 'sm' ? '12px' : size === 'md' ? '14px' : '16px',
              fontWeight: 500,
              border: '2px solid #fffefb',
            }}
          >
            +{remainingCount}
          </MuiAvatar>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

export { Avatar, AvatarGroup };
