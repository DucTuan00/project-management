'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { TOAST_DURATION } from '@/lib/constants';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, TOAST_DURATION);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast, removeToast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <>
      {toasts.map((t) => (
        <Snackbar
          key={t.id}
          open={true}
          autoHideDuration={TOAST_DURATION}
          onClose={() => removeToast(t.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{
            '& .MuiSnackbar-root': {
              bottom: '16px',
              right: '16px',
            },
          }}
        >
          <Alert
            onClose={() => removeToast(t.id)}
            severity={t.type}
            variant="filled"
            sx={{
              width: '100%',
              borderRadius: '12px',
              backgroundColor:
                t.type === 'success'
                  ? '#16a34a'
                  : t.type === 'error'
                  ? '#dc2626'
                  : '#ff4f00',
              '& .MuiAlert-message': {
                fontSize: '14px',
                fontWeight: 500,
              },
            }}
          >
            {t.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
}

// Standalone toast component for simple usage
interface ToastProps {
  message: string;
  type?: ToastType;
  onClose?: () => void;
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  return (
    <Alert
      severity={type}
      onClose={onClose}
      sx={{
        borderRadius: '12px',
        backgroundColor:
          type === 'success'
            ? '#dcfce7'
            : type === 'error'
            ? '#fee2e2'
            : '#fff7ed',
        color:
          type === 'success'
            ? '#16a34a'
            : type === 'error'
            ? '#dc2626'
            : '#ff4f00',
        border: `1px solid ${
          type === 'success'
            ? '#bbf7d0'
            : type === 'error'
            ? '#fecaca'
            : '#fed7aa'
        }`,
        '& .MuiAlert-message': {
          fontSize: '14px',
          fontWeight: 500,
        },
      }}
    >
      {message}
    </Alert>
  );
}
