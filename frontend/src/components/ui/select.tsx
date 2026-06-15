'use client';

import React from 'react';
import MuiSelect from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  id?: string;
  name?: string;
  ref?: React.Ref<HTMLSelectElement>;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, onChange, id, value, name, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const handleChange = (e: any) => {
      onChange?.(e.target.value as string);
    };

    return (
      <FormControl fullWidth error={!!error} className={cn(className)}>
        {label && <InputLabel id={`${selectId}-label`}>{label}</InputLabel>}
        <MuiSelect
          ref={ref}
          labelId={`${selectId}-label`}
          id={selectId}
          name={name}
          value={value || ''}
          onChange={handleChange}
          label={label}
          sx={{
            borderRadius: '6px',
            backgroundColor: '#fffefb',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#c5c0b1',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#939084',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#ff4f00',
            },
          }}
        >
          {placeholder && (
            <MenuItem value="" disabled>
              {placeholder}
            </MenuItem>
          )}
          {options.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </MenuItem>
          ))}
        </MuiSelect>
        {error && <FormHelperText>{error}</FormHelperText>}
      </FormControl>
    );
  }
);

Select.displayName = 'Select';

export { Select };
