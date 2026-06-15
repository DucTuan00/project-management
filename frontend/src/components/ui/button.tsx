'use client';

import React from 'react';
import MuiButton from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const muiVariant = variant === 'ghost' ? 'text' : variant === 'secondary' ? 'outlined' : 'contained';

    const muiColor = variant === 'danger' ? 'error' : 'primary';

    const muiSize = size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'medium';

    return (
      <MuiButton
        ref={ref}
        variant={muiVariant}
        color={muiColor}
        size={muiSize}
        disabled={disabled || loading}
        className={cn(className)}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        sx={{
          ...(variant === 'secondary' && {
            borderColor: '#c5c0b1',
            color: '#201515',
            '&:hover': {
              borderColor: '#939084',
              backgroundColor: '#f8f4f0',
            },
          }),
          ...(variant === 'ghost' && {
            color: '#605d52',
            '&:hover': {
              backgroundColor: '#f8f4f0',
            },
          }),
          ...(variant === 'danger' && {
            backgroundColor: '#dc2626',
            '&:hover': {
              backgroundColor: '#b91c1c',
            },
          }),
        }}
        {...(props as any)}
      >
        {children}
      </MuiButton>
    );
  }
);

Button.displayName = 'Button';

export { Button };
