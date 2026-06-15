'use client';

import React from 'react';
import MuiDialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
}: ModalProps) {
  const sizeMap = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const,
    xl: 'xl' as const,
  };

  return (
    <MuiDialog
      open={isOpen}
      onClose={onClose}
      maxWidth={sizeMap[size]}
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '12px',
          border: '1px solid #c5c0b1',
          backgroundColor: '#fffefb',
        },
      }}
    >
      {(title || showClose) && (
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #c5c0b1',
            px: 3,
            py: 2,
            color: '#201515',
          }}
        >
          {title}
          {showClose && (
            <IconButton onClick={onClose} size="small" sx={{ color: '#939084' }}>
              <X size={20} />
            </IconButton>
          )}
        </DialogTitle>
      )}
      <DialogContent sx={{ px: 3, py: 2 }}>
        {children}
      </DialogContent>
    </MuiDialog>
  );
}

// Modal sub-components for consistent layout
interface ModalActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalActions({ children, className }: ModalActionsProps) {
  return (
    <DialogActions
      className={cn('border-t border-mute', className)}
      sx={{
        px: 3,
        py: 2,
        justifyContent: 'flex-end',
        gap: 1,
      }}
    >
      {children}
    </DialogActions>
  );
}
