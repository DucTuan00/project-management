'use client';

import React from 'react';
import MuiSkeleton from '@mui/material/Skeleton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { SxProps, Theme } from '@mui/material/styles';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  sx?: SxProps<Theme>;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'rectangular', width, height, sx, ...props }, ref) => {
    const muiVariant = variant === 'text' ? 'text' : variant === 'circular' ? 'circular' : 'rectangular';

    return (
      <MuiSkeleton
        ref={ref}
        variant={muiVariant}
        width={width}
        height={height}
        className={cn(className)}
        sx={[
          {
            backgroundColor: '#f8f4f0',
            '&::after': {
              background: 'linear-gradient(90deg, transparent, rgba(197, 192, 177, 0.3), transparent)',
            },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Pre-built skeleton patterns
function SkeletonCard() {
  return (
    <Card sx={{ backgroundColor: '#fffefb', border: '1px solid #c5c0b1', borderRadius: '12px', boxShadow: 'none' }}>
      <CardContent sx={{ p: 3 }}>
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="25%" height={16} />
            <Skeleton variant="text" width="50%" height={14} />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton variant="text" width="100%" height={12} />
          <Skeleton variant="text" width="75%" height={12} />
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <Card sx={{ backgroundColor: '#fffefb', border: '1px solid #c5c0b1', borderRadius: '12px', boxShadow: 'none' }}>
      <div className="border-b border-mute px-6 py-3">
        <Skeleton variant="text" width="33%" height={16} />
      </div>
      <div className="divide-y divide-mute">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4">
            <div className="flex items-center gap-4">
              <Skeleton variant="circular" width={32} height={32} />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="66%" height={16} />
                <Skeleton variant="text" width="33%" height={14} />
              </div>
              <Skeleton variant="rectangular" width={64} height={24} sx={{ borderRadius: '9999px' }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="75%" height={16} />
            <Skeleton variant="text" width="50%" height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonTable, SkeletonList };
