'use client';

import React from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    primary: {
      main: '#ff4f00',
      light: '#ff7a3d',
      dark: '#cc3f00',
      contrastText: '#fffefb',
    },
    secondary: {
      main: '#201515',
      light: '#36342e',
      dark: '#0d0a0a',
      contrastText: '#fffefb',
    },
    background: {
      default: '#fffefb',
      paper: '#f8f4f0',
    },
    text: {
      primary: '#201515',
      secondary: '#605d52',
    },
    error: {
      main: '#dc2626',
      light: '#fecaca',
      dark: '#991b1b',
    },
    warning: {
      main: '#f59e0b',
      light: '#fef3c7',
      dark: '#92400e',
    },
    success: {
      main: '#16a34a',
      light: '#dcfce7',
      dark: '#166534',
    },
    info: {
      main: '#3b82f6',
      light: '#dbeafe',
      dark: '#1e40af',
    },
    divider: '#c5c0b1',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h1: {
      fontWeight: 500,
      fontSize: '3rem',
      lineHeight: 1,
      letterSpacing: '0px',
    },
    h2: {
      fontWeight: 500,
      fontSize: '2rem',
      lineHeight: 1.2,
      letterSpacing: '0px',
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.5rem',
      lineHeight: 1.3,
      letterSpacing: '0px',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '-0.2px',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      fontSize: '0.875rem',
      textTransform: 'none' as const,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '8px 24px',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        sizeSmall: {
          padding: '4px 16px',
          fontSize: '0.8125rem',
        },
        sizeLarge: {
          padding: '12px 32px',
          fontSize: '1rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #c5c0b1',
          boxShadow: 'none',
          backgroundColor: '#f8f4f0',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
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
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          fontWeight: 500,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: '1px solid #c5c0b1',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #c5c0b1',
        },
      },
    },
  },
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
