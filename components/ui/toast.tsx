/**
 * Enhanced Toast Notification System
 * 
 * A comprehensive toast notification system with auto-dismiss functionality,
 * multiple variants, proper positioning, and smooth animations.
 * 
 * Validates: Requirements 9.4
 */

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all backdrop-blur-sm',
  {
    variants: {
      variant: {
        default: 'border-neutral-200 bg-white/95 text-neutral-900 shadow-md',
        success: 'border-energy-200 bg-energy-50/95 text-energy-900 shadow-energy-500/20',
        error: 'border-red-200 bg-red-50/95 text-red-900 shadow-red-500/20',
        warning: 'border-solar-200 bg-solar-50/95 text-solar-900 shadow-solar-500/20',
        info: 'border-ocean-200 bg-ocean-50/95 text-ocean-900 shadow-ocean-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const ToastContext = React.createContext<{
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
  clearAllToasts: () => {},
});

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  persistent?: boolean; // Don't auto-dismiss
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: LucideIcon;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { 
      ...toast, 
      id,
      position: toast.position || 'top-right',
      duration: toast.duration ?? (toast.persistent ? 0 : 5000)
    };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove toast after duration (unless persistent)
    if (!toast.persistent && newToast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.duration);
    }
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAllToasts }}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

function ToastViewport() {
  const { toasts, removeToast } = React.useContext(ToastContext);

  if (toasts.length === 0) return null;

  // Group toasts by position
  const toastsByPosition = toasts.reduce((acc, toast) => {
    const position = toast.position || 'top-right';
    if (!acc[position]) acc[position] = [];
    acc[position].push(toast);
    return acc;
  }, {} as Record<string, Toast[]>);

  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'top-left':
        return 'fixed top-0 left-0 z-[100] flex max-h-screen w-full max-w-[420px] flex-col p-4';
      case 'top-right':
        return 'fixed top-0 right-0 z-[100] flex max-h-screen w-full max-w-[420px] flex-col p-4';
      case 'top-center':
        return 'fixed top-0 left-1/2 -translate-x-1/2 z-[100] flex max-h-screen w-full max-w-[420px] flex-col p-4';
      case 'bottom-left':
        return 'fixed bottom-0 left-0 z-[100] flex max-h-screen w-full max-w-[420px] flex-col-reverse p-4';
      case 'bottom-right':
        return 'fixed bottom-0 right-0 z-[100] flex max-h-screen w-full max-w-[420px] flex-col-reverse p-4';
      case 'bottom-center':
        return 'fixed bottom-0 left-1/2 -translate-x-1/2 z-[100] flex max-h-screen w-full max-w-[420px] flex-col-reverse p-4';
      default:
        return 'fixed top-0 right-0 z-[100] flex max-h-screen w-full max-w-[420px] flex-col p-4';
    }
  };

  const getAnimationDirection = (position: string) => {
    if (position.includes('left')) return { x: -100 };
    if (position.includes('right')) return { x: 100 };
    if (position.includes('top')) return { y: -100 };
    if (position.includes('bottom')) return { y: 100 };
    return { x: 100 };
  };

  return (
    <>
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <div key={position} className={getPositionClasses(position)}>
          <AnimatePresence mode="popLayout">
            {positionToasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ 
                  opacity: 0, 
                  scale: 0.95,
                  ...getAnimationDirection(position)
                }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  x: 0,
                  y: 0
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.95,
                  ...getAnimationDirection(position)
                }}
                transition={{ 
                  duration: 0.2,
                  ease: 'easeOut'
                }}
                layout
                className="mb-2 w-full"
              >
                <ToastComponent 
                  toast={toast} 
                  onClose={() => removeToast(toast.id)} 
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ))}
    </>
  );
}

interface ToastComponentProps {
  toast: Toast;
  onClose: () => void;
}

function ToastComponent({ toast, onClose }: ToastComponentProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [progress, setProgress] = React.useState(100);
  const progressRef = React.useRef<NodeJS.Timeout | null>(null);

  // Auto-dismiss progress bar
  React.useEffect(() => {
    if (toast.persistent || toast.duration === 0) return;

    const startTime = Date.now();
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration!) * 100);
      setProgress(remaining);

      if (remaining > 0 && !isHovered) {
        progressRef.current = setTimeout(updateProgress, 50);
      }
    };

    if (!isHovered) {
      updateProgress();
    }

    return () => {
      if (progressRef.current) {
        clearTimeout(progressRef.current);
      }
    };
  }, [toast.duration, toast.persistent, isHovered]);

  const getIcon = () => {
    if (toast.icon) {
      const CustomIcon = toast.icon;
      return <CustomIcon className="h-5 w-5" />;
    }

    switch (toast.variant) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-energy-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-solar-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-ocean-600" />;
      default:
        return <Info className="h-5 w-5 text-neutral-600" />;
    }
  };

  return (
    <div 
      className={cn(toastVariants({ variant: toast.variant }))}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Progress bar for auto-dismiss */}
      {!toast.persistent && toast.duration! > 0 && (
        <div className="absolute bottom-0 left-0 h-1 bg-black/10 w-full">
          <div 
            className="h-full bg-current opacity-30 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 space-y-1">
          <div className="text-sm font-semibold leading-tight">{toast.title}</div>
          {toast.description && (
            <div className="text-sm opacity-90 leading-tight">{toast.description}</div>
          )}
        </div>
      </div>
      
      {toast.action && (
        <button
          onClick={toast.action.onClick}
          className="text-sm font-medium underline hover:no-underline transition-colors ml-3"
        >
          {toast.action.label}
        </button>
      )}
      
      <button
        onClick={onClose}
        className="absolute right-2 top-2 rounded-md p-1 text-current opacity-50 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2"
        aria-label="Fechar notificação"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  // Helper methods for common toast types
  const toast = React.useMemo(() => ({
    success: (title: string, description?: string, options?: Partial<Toast>) => 
      context.addToast({ variant: 'success', title, description, ...options }),
    
    error: (title: string, description?: string, options?: Partial<Toast>) => 
      context.addToast({ variant: 'error', title, description, ...options }),
    
    warning: (title: string, description?: string, options?: Partial<Toast>) => 
      context.addToast({ variant: 'warning', title, description, ...options }),
    
    info: (title: string, description?: string, options?: Partial<Toast>) => 
      context.addToast({ variant: 'info', title, description, ...options }),
    
    default: (title: string, description?: string, options?: Partial<Toast>) => 
      context.addToast({ variant: 'default', title, description, ...options }),
    
    custom: (toast: Omit<Toast, 'id'>) => context.addToast(toast),
    
    dismiss: context.removeToast,
    dismissAll: context.clearAllToasts,
  }), [context]);

  return toast;
}

// Predefined toast helpers for common scenarios
export const showSuccessToast = (title: string, description?: string) => ({
  variant: 'success' as const,
  title,
  description,
  duration: 4000,
});

export const showErrorToast = (title: string, description?: string, persistent = false) => ({
  variant: 'error' as const,
  title,
  description,
  persistent,
  duration: persistent ? 0 : 6000,
});

export const showWarningToast = (title: string, description?: string) => ({
  variant: 'warning' as const,
  title,
  description,
  duration: 5000,
});

export const showInfoToast = (title: string, description?: string) => ({
  variant: 'info' as const,
  title,
  description,
  duration: 4000,
});

export const showNetworkErrorToast = (onRetry?: () => void) => ({
  variant: 'error' as const,
  title: 'Erro de Conexão',
  description: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
  persistent: true,
  action: onRetry ? {
    label: 'Tentar Novamente',
    onClick: onRetry,
  } : undefined,
});

export const showOfflineToast = () => ({
  variant: 'warning' as const,
  title: 'Você está offline',
  description: 'Algumas funcionalidades podem não estar disponíveis.',
  persistent: true,
  position: 'bottom-center' as const,
});

export type { Toast };
export { ToastProvider as ToastRoot };