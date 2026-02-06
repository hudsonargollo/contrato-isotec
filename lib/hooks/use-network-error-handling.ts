/**
 * Network Error Handling Hook
 * 
 * Comprehensive network error handling with retry functionality,
 * offline detection, and form data caching to prevent data loss.
 * 
 * Validates: Requirements 9.3
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/toast';

export interface NetworkState {
  isOnline: boolean;
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
}

export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  maxRetryDelay?: number;
}

export interface NetworkErrorHandlerOptions {
  retryConfig?: RetryConfig;
  enableOfflineDetection?: boolean;
  enableFormDataCaching?: boolean;
  showToastNotifications?: boolean;
  onNetworkStatusChange?: (isOnline: boolean) => void;
  onRetryAttempt?: (attempt: number, maxRetries: number) => void;
  onRetrySuccess?: () => void;
  onRetryFailure?: (error: Error) => void;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  maxRetryDelay: 10000,
};

export function useNetworkErrorHandling(options: NetworkErrorHandlerOptions = {}) {
  const {
    retryConfig = DEFAULT_RETRY_CONFIG,
    enableOfflineDetection = true,
    enableFormDataCaching = true,
    showToastNotifications = true,
    onNetworkStatusChange,
    onRetryAttempt,
    onRetrySuccess,
    onRetryFailure,
  } = options;

  const toast = useToast();
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isRetrying: false,
    retryCount: 0,
    lastError: null,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const formDataCacheRef = useRef<Map<string, any>>(new Map());

  // Network status detection
  useEffect(() => {
    if (!enableOfflineDetection || typeof window === 'undefined') return;

    const handleOnline = () => {
      setNetworkState(prev => ({ ...prev, isOnline: true }));
      onNetworkStatusChange?.(true);
      
      if (showToastNotifications) {
        toast.success('Conexão Restaurada', 'Você está online novamente.');
      }
    };

    const handleOffline = () => {
      setNetworkState(prev => ({ ...prev, isOnline: false }));
      onNetworkStatusChange?.(false);
      
      if (showToastNotifications) {
        toast.custom({
          variant: 'warning',
          title: 'Você está offline',
          description: 'Algumas funcionalidades podem não estar disponíveis.',
          persistent: true,
          position: 'bottom-center',
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enableOfflineDetection, showToastNotifications, onNetworkStatusChange, toast]);

  // Form data caching
  const cacheFormData = useCallback((key: string, data: any) => {
    if (!enableFormDataCaching) return;
    
    try {
      formDataCacheRef.current.set(key, data);
      localStorage.setItem(`form_cache_${key}`, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to cache form data:', error);
    }
  }, [enableFormDataCaching]);

  const getCachedFormData = useCallback((key: string) => {
    if (!enableFormDataCaching) return null;
    
    try {
      // Try memory cache first
      if (formDataCacheRef.current.has(key)) {
        return formDataCacheRef.current.get(key);
      }
      
      // Fallback to localStorage
      const cached = localStorage.getItem(`form_cache_${key}`);
      if (cached) {
        const data = JSON.parse(cached);
        formDataCacheRef.current.set(key, data);
        return data;
      }
    } catch (error) {
      console.warn('Failed to retrieve cached form data:', error);
    }
    
    return null;
  }, [enableFormDataCaching]);

  const clearCachedFormData = useCallback((key: string) => {
    if (!enableFormDataCaching) return;
    
    try {
      formDataCacheRef.current.delete(key);
      localStorage.removeItem(`form_cache_${key}`);
    } catch (error) {
      console.warn('Failed to clear cached form data:', error);
    }
  }, [enableFormDataCaching]);

  // Retry logic with exponential backoff
  const calculateRetryDelay = useCallback((attempt: number): number => {
    const baseDelay = retryConfig.retryDelay || DEFAULT_RETRY_CONFIG.retryDelay!;
    const multiplier = retryConfig.backoffMultiplier || DEFAULT_RETRY_CONFIG.backoffMultiplier!;
    const maxDelay = retryConfig.maxRetryDelay || DEFAULT_RETRY_CONFIG.maxRetryDelay!;
    
    const delay = baseDelay * Math.pow(multiplier, attempt - 1);
    return Math.min(delay, maxDelay);
  }, [retryConfig]);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T> => {
    const maxRetries = retryConfig.maxRetries || DEFAULT_RETRY_CONFIG.maxRetries!;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        setNetworkState(prev => ({ 
          ...prev, 
          isRetrying: attempt > 1, 
          retryCount: attempt - 1 
        }));

        if (attempt > 1) {
          onRetryAttempt?.(attempt - 1, maxRetries);
        }

        const result = await operation();
        
        // Success
        setNetworkState(prev => ({ 
          ...prev, 
          isRetrying: false, 
          retryCount: 0, 
          lastError: null 
        }));

        if (attempt > 1) {
          onRetrySuccess?.();
          if (showToastNotifications) {
            toast.success('Operação Bem-sucedida', 'A operação foi concluída com sucesso.');
          }
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        
        setNetworkState(prev => ({ 
          ...prev, 
          lastError: lastError 
        }));

        // If this is the last attempt, don't wait
        if (attempt > maxRetries) {
          break;
        }

        // Wait before retrying
        const delay = calculateRetryDelay(attempt);
        await new Promise(resolve => {
          retryTimeoutRef.current = setTimeout(resolve, delay);
        });
      }
    }

    // All retries failed
    setNetworkState(prev => ({ 
      ...prev, 
      isRetrying: false, 
      retryCount: maxRetries 
    }));

    onRetryFailure?.(lastError!);
    
    if (showToastNotifications) {
      toast.custom({
        variant: 'error',
        title: 'Erro de Conexão',
        description: `Não foi possível ${operationName || 'completar a operação'}. Verifique sua conexão e tente novamente.`,
        persistent: true,
        action: {
          label: 'Tentar Novamente',
          onClick: () => executeWithRetry(operation, operationName),
        },
      });
    }

    throw lastError!;
  }, [
    retryConfig,
    calculateRetryDelay,
    onRetryAttempt,
    onRetrySuccess,
    onRetryFailure,
    showToastNotifications,
    toast,
  ]);

  // Manual retry function
  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T> => {
    return executeWithRetry(operation, operationName);
  }, [executeWithRetry]);

  // Network-aware fetch wrapper
  const networkFetch = useCallback(async (
    url: string,
    options: RequestInit = {},
    operationName?: string
  ): Promise<Response> => {
    if (!networkState.isOnline) {
      throw new Error('Você está offline. Verifique sua conexão com a internet.');
    }

    return executeWithRetry(async () => {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error(`Erro do servidor (${response.status})`);
        } else if (response.status === 404) {
          throw new Error('Recurso não encontrado');
        } else if (response.status === 401) {
          throw new Error('Não autorizado');
        } else if (response.status === 403) {
          throw new Error('Acesso negado');
        } else {
          throw new Error(`Erro na requisição (${response.status})`);
        }
      }

      return response;
    }, operationName || `requisição para ${url}`);
  }, [networkState.isOnline, executeWithRetry]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    networkState,
    retry,
    networkFetch,
    cacheFormData,
    getCachedFormData,
    clearCachedFormData,
    isOnline: networkState.isOnline,
    isRetrying: networkState.isRetrying,
    retryCount: networkState.retryCount,
    lastError: networkState.lastError,
  };
}

// Utility function to check if an error is network-related
export function isNetworkError(error: Error): boolean {
  const networkErrorMessages = [
    'fetch',
    'network',
    'connection',
    'timeout',
    'offline',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'NetworkError',
  ];

  const errorMessage = error.message.toLowerCase();
  return networkErrorMessages.some(msg => errorMessage.includes(msg.toLowerCase()));
}

// Utility function to get user-friendly error message
export function getNetworkErrorMessage(error: Error): string {
  if (error.message.includes('offline') || error.message.includes('network')) {
    return 'Você está offline. Verifique sua conexão com a internet.';
  }
  
  if (error.message.includes('timeout')) {
    return 'A operação demorou muito para responder. Tente novamente.';
  }
  
  if (error.message.includes('500')) {
    return 'Erro interno do servidor. Tente novamente em alguns minutos.';
  }
  
  if (error.message.includes('404')) {
    return 'O recurso solicitado não foi encontrado.';
  }
  
  if (error.message.includes('401')) {
    return 'Você precisa fazer login para acessar este recurso.';
  }
  
  if (error.message.includes('403')) {
    return 'Você não tem permissão para acessar este recurso.';
  }
  
  return 'Ocorreu um erro de conexão. Verifique sua internet e tente novamente.';
}