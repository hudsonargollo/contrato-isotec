/**
 * Network Status Component
 * 
 * A visual indicator for network connectivity status with retry functionality.
 * Shows offline indicator and provides retry options for failed requests.
 * 
 * Validates: Requirements 9.3
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkErrorHandling } from '@/lib/hooks/use-network-error-handling';

const networkStatusVariants = cva(
  'fixed z-50 transition-all duration-300',
  {
    variants: {
      position: {
        'top-center': 'top-4 left-1/2 -translate-x-1/2',
        'top-right': 'top-4 right-4',
        'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
        'bottom-right': 'bottom-4 right-4',
      },
      variant: {
        online: 'text-energy-600',
        offline: 'text-red-600',
        retrying: 'text-solar-600',
      },
    },
    defaultVariants: {
      position: 'bottom-center',
      variant: 'online',
    },
  }
);

interface NetworkStatusProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof networkStatusVariants> {
  showWhenOnline?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  onRetry?: () => void;
  retryLabel?: string;
  showRetryButton?: boolean;
}

export function NetworkStatus({
  className,
  position = 'bottom-center',
  showWhenOnline = false,
  autoHide = true,
  autoHideDelay = 3000,
  onRetry,
  retryLabel = 'Tentar Novamente',
  showRetryButton = true,
}: NetworkStatusProps) {
  const { networkState } = useNetworkErrorHandling({
    showToastNotifications: false, // We'll handle notifications here
  });
  
  const [isVisible, setIsVisible] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(false);
  const hideTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Determine visibility
  React.useEffect(() => {
    if (isDismissed) return;

    const shouldShow = !networkState.isOnline || 
                      networkState.isRetrying || 
                      (showWhenOnline && networkState.isOnline);
    
    setIsVisible(shouldShow);

    // Auto-hide when online
    if (networkState.isOnline && autoHide && !networkState.isRetrying) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [
    networkState.isOnline, 
    networkState.isRetrying, 
    showWhenOnline, 
    autoHide, 
    autoHideDelay,
    isDismissed
  ]);

  // Reset dismissed state when going offline
  React.useEffect(() => {
    if (!networkState.isOnline) {
      setIsDismissed(false);
    }
  }, [networkState.isOnline]);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default retry behavior - reload the page
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  const getStatusContent = () => {
    if (networkState.isRetrying) {
      return {
        variant: 'retrying' as const,
        icon: RefreshCw,
        title: 'Reconectando...',
        description: `Tentativa ${networkState.retryCount} de reconexão`,
        showRetry: false,
      };
    }

    if (!networkState.isOnline) {
      return {
        variant: 'offline' as const,
        icon: WifiOff,
        title: 'Você está offline',
        description: 'Verifique sua conexão com a internet',
        showRetry: showRetryButton,
      };
    }

    return {
      variant: 'online' as const,
      icon: Wifi,
      title: 'Conectado',
      description: 'Sua conexão foi restaurada',
      showRetry: false,
    };
  };

  const status = getStatusContent();
  const StatusIcon = status.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: (position || 'top-center').includes('bottom') ? 50 : -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: (position || 'top-center').includes('bottom') ? 50 : -50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(networkStatusVariants({ position }), className)}
        >
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  'flex-shrink-0 p-2 rounded-full',
                  status.variant === 'online' && 'bg-energy-100',
                  status.variant === 'offline' && 'bg-red-100',
                  status.variant === 'retrying' && 'bg-solar-100'
                )}>
                  <StatusIcon 
                    className={cn(
                      'h-5 w-5',
                      status.variant === 'online' && 'text-energy-600',
                      status.variant === 'offline' && 'text-red-600',
                      status.variant === 'retrying' && 'text-solar-600 animate-spin'
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-semibold',
                    status.variant === 'online' && 'text-energy-900',
                    status.variant === 'offline' && 'text-red-900',
                    status.variant === 'retrying' && 'text-solar-900'
                  )}>
                    {status.title}
                  </p>
                  <p className="text-xs text-neutral-600">
                    {status.description}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {status.showRetry && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRetry}
                      className="h-8 px-3"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      {retryLabel}
                    </Button>
                  )}

                  <button
                    onClick={handleDismiss}
                    className="p-1 rounded-md hover:bg-neutral-100 transition-colors"
                    aria-label="Fechar"
                  >
                    <X className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Compact version for minimal UI impact
export function NetworkStatusIndicator({
  className,
  ...props
}: Omit<NetworkStatusProps, 'position'>) {
  const { networkState } = useNetworkErrorHandling({
    showToastNotifications: false,
  });

  if (networkState.isOnline && !networkState.isRetrying) {
    return null;
  }

  return (
    <div className={cn('inline-flex items-center space-x-2', className)} {...props}>
      {networkState.isRetrying ? (
        <>
          <RefreshCw className="h-4 w-4 text-solar-500 animate-spin" />
          <span className="text-sm text-solar-600">Reconectando...</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-600">Offline</span>
        </>
      )}
    </div>
  );
}

// Hook for programmatic network status management
export function useNetworkStatus() {
  const { networkState, retry, networkFetch } = useNetworkErrorHandling();
  
  return {
    isOnline: networkState.isOnline,
    isRetrying: networkState.isRetrying,
    retryCount: networkState.retryCount,
    lastError: networkState.lastError,
    retry,
    networkFetch,
  };
}