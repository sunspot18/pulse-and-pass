'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

export interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '420px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const borderColor =
            toast.type === 'error'
              ? 'var(--color-void)'
              : toast.type === 'success'
                ? 'var(--color-cyan)'
                : 'var(--color-amber)';
          return (
            <div
              key={toast.id}
              role="alert"
              style={{
                pointerEvents: 'auto',
                backgroundColor: 'var(--color-surface)',
                border: `2px solid ${borderColor}`,
                boxShadow: 'var(--shadow-hard)',
                padding: '12px 18px',
                color: 'var(--color-paper)',
                fontFamily: 'var(--font-mono-stack)',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                animation: 'fadeIn 0.2s ease-in-out',
              }}
            >
              <span style={{ color: borderColor, fontWeight: 800, fontSize: '1rem' }}>
                {toast.type === 'error' ? '✖' : toast.type === 'success' ? '✔' : '●'}
              </span>
              <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-paper-muted)',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontFamily: 'var(--font-mono-stack)',
                  fontSize: '0.875rem',
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
