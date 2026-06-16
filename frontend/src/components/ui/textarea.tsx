'use client';

import React from 'react';
import MuiTextField from '@mui/material/TextField';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <MuiTextField
        inputRef={ref}
        id={textareaId}
        label={label}
        error={!!error}
        helperText={error || helperText}
        fullWidth
        multiline
        minRows={4}
        className={cn(className)}
        slotProps={{
          input: {
            style: {
              minHeight: '100px',
            },
          },
          htmlInput: {
            ...props,
          },
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

Textarea.displayName = 'Textarea';

export { Textarea };
