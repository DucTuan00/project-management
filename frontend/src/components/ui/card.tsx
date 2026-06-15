'use client';

import React from 'react';
import MuiCard, { CardProps as MuiCardProps } from '@mui/material/Card';
import MuiCardContent, { CardContentProps } from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import { SxProps, Theme } from '@mui/material/styles';
import { cn } from '@/lib/utils';

interface CardProps extends Omit<MuiCardProps, 'classes'> {
  children: React.ReactNode;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardContentPropsExtended extends CardContentProps {
  children: React.ReactNode;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, sx, ...props }, ref) => (
    <MuiCard
      ref={ref}
      className={cn(className)}
      sx={[
        {
          backgroundColor: '#f8f4f0',
          border: '1px solid #c5c0b1',
          borderRadius: '12px',
          boxShadow: 'none',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {children}
    </MuiCard>
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-6 py-4 border-b border-mute', className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

const CardContentCustom = React.forwardRef<HTMLDivElement, CardContentPropsExtended>(
  ({ className, children, sx, ...props }, ref) => (
    <MuiCardContent
      ref={ref}
      className={cn('px-6 py-4', className)}
      sx={[
        { '&:last-child': { pb: '16px' } },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {children}
    </MuiCardContent>
  )
);
CardContentCustom.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <CardActions
      ref={ref}
      className={cn('px-6 py-4 border-t border-mute', className)}
      sx={{ justifyContent: 'flex-start' }}
      {...props}
    >
      {children}
    </CardActions>
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContentCustom as CardContent, CardFooter };
