'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <Box className={cn(className)} sx={{ mb: 4 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          aria-label="Breadcrumb"
          sx={{ mb: 2, fontSize: '14px' }}
        >
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  sx={{
                    color: '#939084',
                    fontSize: '14px',
                    textDecoration: 'none',
                    '&:hover': {
                      color: '#605d52',
                    },
                  }}
                >
                  {crumb.label}
                </Link>
              ) : (
                <Typography
                  sx={{
                    color: '#201515',
                    fontWeight: 500,
                    fontSize: '14px',
                  }}
                >
                  {crumb.label}
                </Typography>
              )}
            </React.Fragment>
          ))}
        </Breadcrumbs>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#201515',
              fontSize: '24px',
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
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
        {actions && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {actions}
          </Box>
        )}
      </Box>
    </Box>
  );
}
