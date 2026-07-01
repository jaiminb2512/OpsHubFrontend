import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Toast } from '../Components/Common/Toast';

let _toastId = 0;
const nextToastId = () => String(++_toastId);

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string, duration?: number) => string;
  showSuccess: (message: string, title?: string, duration?: number) => string;
  showError: (message: string, title?: string, duration?: number) => string;
  showInfo: (message: string, title?: string, duration?: number) => string;
  showWarning: (message: string, title?: string, duration?: number) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string, duration?: number) => {
      const id = nextToastId();
      const newToast: Toast = {
        id,
        type,
        message,
        title,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);
      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message: string, title?: string, duration?: number) => {
      return showToast('success', message, title, duration);
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, title?: string, duration?: number) => {
      return showToast('error', message, title, duration);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, title?: string, duration?: number) => {
      return showToast('info', message, title, duration);
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, title?: string, duration?: number) => {
      return showToast('warning', message, title, duration);
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        removeToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

