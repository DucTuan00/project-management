'use client';

import React from 'react';
import MuiChip from '@mui/material/Chip';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', children, ...props }, ref) => {
    const variantStyles = {
      default: { backgroundColor: '#f8f4f0', color: '#605d52' },
      primary: { backgroundColor: '#fff7ed', color: '#ff4f00' },
      success: { backgroundColor: '#dcfce7', color: '#16a34a' },
      warning: { backgroundColor: '#fef3c7', color: '#d97706' },
      danger: { backgroundColor: '#fee2e2', color: '#dc2626' },
    };

    const sizeStyles = {
      sm: { height: '24px', fontSize: '12px' },
      md: { height: '28px', fontSize: '14px' },
    };

    return (
      <MuiChip
        ref={ref}
        label={children}
        size={size === 'sm' ? 'small' : 'medium'}
        className={cn(className)}
        sx={{
          ...variantStyles[variant],
          ...sizeStyles[size],
          borderRadius: '9999px',
          fontWeight: 500,
          '& .MuiChip-label': {
            padding: size === 'sm' ? '0 8px' : '0 10px',
          },
        }}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
