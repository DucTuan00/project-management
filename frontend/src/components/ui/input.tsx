'use client';

import React from 'react';
import MuiTextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <MuiTextField
        inputRef={ref}
        id={inputId}
        label={label}
        error={!!error}
        helperText={error || helperText}
        fullWidth
        className={cn(className)}
        InputProps={{
          startAdornment: leftIcon ? (
            <InputAdornment position="start">{leftIcon}</InputAdornment>
          ) : undefined,
          endAdornment: rightIcon ? (
            <InputAdornment position="end">{rightIcon}</InputAdornment>
          ) : undefined,
        }}
        inputProps={{
          ...props,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '6px',
            backgroundColor: '#fffefb',
            '& fieldset': {
              borderColor: '#c5c0b1',
            },
            '&:hover fieldset': {
              borderColor: '#939084',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#ff4f00',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#605d52',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#ff4f00',
          },
        }}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
