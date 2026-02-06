/**
 * Pull-to-Refresh Wrapper Component
 * 
 * Wrapper component that adds pull-to-refresh functionality to any content
 * Validates: Requirements 3.4, 5.6
 */

'use client';

import React, { useState, useCallback } from 'react';
import { PullToRefresh } from '@/components/ui/mobile-interactions';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mobile } from '@/lib/utils/mobile-optimization';

interface PullToRefreshWrapperProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  disabled?: boolean;
  showRefreshButton?: boolean;
  refreshButtonPosition?: 'top' | 'bottom' | 'floating';
}

/**
 * PullToRefreshWrapper Component
 * Provides pull-to-refresh functionality with optional manual refresh button
 */
export function PullToRefreshWrapper({
  children,
  onRefresh,
  className,
  disabled = false,
  showRefreshButton = true,
  refreshButtonPosition = 'floating',
}: PullToRefreshWrapperProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing]);

  const RefreshButton = () => (
    <button
      onClick={handleRefresh}
      disabled={disabled || isRefreshing}
      className={cn(
        mobile.button('sm'),
        'bg-solar-500 hover:bg-solar-600 text-white shadow-lg',
        'disabled:bg-neutral-400 disabled:cursor-not-allowed',
        'flex items-center gap-2',
        refreshButtonPosition === 'floating' && 'fixed bottom-20 right-4 z-50 rounded-full p-3',
        refreshButtonPosition === 'top' && 'mb-4',
        refreshButtonPosition === 'bottom' && 'mt-4'
      )}
      aria-label="Atualizar conteúdo"
    >
      <RefreshCw 
        className={cn(
          'w-4 h-4',
          isRefreshing && 'animate-spin'
        )} 
      />
      {refreshButtonPosition !== 'floating' && (
        <span className="text-sm">
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </span>
      )}
    </button>
  );

  const LastRefreshIndicator = () => {
    if (!lastRefresh) return null;
    
    const timeAgo = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    let timeText = '';
    
    if (timeAgo < 60) {
      timeText = 'agora mesmo';
    } else if (timeAgo < 3600) {
      timeText = `${Math.floor(timeAgo / 60)}min atrás`;
    } else {
      timeText = `${Math.floor(timeAgo / 3600)}h atrás`;
    }
    
    return (
      <div className="text-xs text-neutral-500 text-center py-2">
        Última atualização: {timeText}
      </div>
    );
  };

  // On mobile, use pull-to-refresh; on desktop, show refresh button
  if (mobile.viewport.isMobile()) {
    return (
      <div className={cn('relative', className)}>
        {showRefreshButton && refreshButtonPosition === 'top' && <RefreshButton />}
        
        <PullToRefresh
          onRefresh={handleRefresh}
          disabled={disabled}
          refreshingText="Atualizando conteúdo..."
          className="min-h-screen"
        >
          {children}
          <LastRefreshIndicator />
        </PullToRefresh>
        
        {showRefreshButton && refreshButtonPosition === 'bottom' && <RefreshButton />}
        {showRefreshButton && refreshButtonPosition === 'floating' && <RefreshButton />}
      </div>
    );
  }

  // Desktop version with manual refresh button
  return (
    <div className={cn('relative', className)}>
      {showRefreshButton && refreshButtonPosition === 'top' && <RefreshButton />}
      
      <div className="relative">
        {children}
        <LastRefreshIndicator />
      </div>
      
      {showRefreshButton && refreshButtonPosition === 'bottom' && <RefreshButton />}
      {showRefreshButton && refreshButtonPosition === 'floating' && <RefreshButton />}
    </div>
  );
}

/**
 * Hook for managing refresh state
 */
export function useRefreshState() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (refreshFn: () => Promise<void>) => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setError(null);
    
    try {
      await refreshFn();
      setLastRefresh(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar';
      setError(errorMessage);
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  return {
    isRefreshing,
    lastRefresh,
    error,
    refresh,
  };
}

export default PullToRefreshWrapper;