'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';

interface ToastProps {
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export function Toast({ position = 'top-center' }: ToastProps) {
  return (
    <Toaster
      position={position}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--toast-bg, #ffffff)',
          color: 'var(--toast-color, #111827)',
          border: '1px solid var(--toast-border, #e5e7eb)',
          borderRadius: '8px',
          fontSize: '14px',
          padding: '12px 16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
}