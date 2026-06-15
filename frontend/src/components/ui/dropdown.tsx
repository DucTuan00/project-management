'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import MuiMenu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { cn } from '@/lib/utils';

export interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({
  trigger,
  items,
  align = 'left',
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        close();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [close]);

  return (
    <div ref={anchorRef} className="relative inline-block">
      <div onClick={toggle} className="cursor-pointer">
        {trigger}
      </div>

      <MuiMenu
        anchorEl={anchorRef.current}
        open={isOpen}
        onClose={close}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: align === 'right' ? 'right' : 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: align === 'right' ? 'right' : 'left',
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '12px',
              border: '1px solid #c5c0b1',
              backgroundColor: '#fffefb',
              minWidth: '180px',
              mt: 1,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          },
        }}
      >
        {items.map((item, index) => (
          <MuiMenuItem
            key={index}
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                close();
              }
            }}
            disabled={item.disabled}
            sx={{
              ...(item.danger && {
                color: '#dc2626',
                '&:hover': {
                  backgroundColor: '#fee2e2',
                },
              }),
              ...(!item.danger && {
                color: '#605d52',
                '&:hover': {
                  backgroundColor: '#f8f4f0',
                },
              }),
              py: 1,
              px: 2,
            }}
          >
            {item.icon && (
              <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5 }}>
                {item.icon}
              </ListItemIcon>
            )}
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '14px',
                fontWeight: 500,
              }}
            />
          </MuiMenuItem>
        ))}
      </MuiMenu>
    </div>
  );
}
