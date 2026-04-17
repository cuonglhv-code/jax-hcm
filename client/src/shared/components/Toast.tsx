import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { createPortal } from 'react-dom';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  toast: (options: { message: string; variant?: ToastVariant; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-success" />,
  error: <AlertCircle className="w-5 h-5 text-error" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning" />,
  info: <Info className="w-5 h-5 text-primary" />
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback(({ message, variant = 'info', duration = 4000 }: { message: string, variant?: ToastVariant, duration?: number }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, variant, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => (
            <ToastItemComponent key={t.id} toast={t} onClose={() => removeToast(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

function ToastItemComponent({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <div className="bg-surface border border-border shadow-md rounded-lg p-4 min-w-[18rem] max-w-sm flex items-start gap-3 pointer-events-auto transition-transform duration-300 translate-x-0">
      <div className="flex-shrink-0 mt-0.5">{icons[toast.variant]}</div>
      <div className="flex-1 text-sm text-text-base leading-relaxed break-words">
        {toast.message}
      </div>
      <button onClick={onClose} className="flex-shrink-0 text-text-muted hover:bg-surface-offset transition-colors rounded p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
