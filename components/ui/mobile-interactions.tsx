/**
 * Mobile Interactions Component
 * 
 * Provides mobile-specific interactions including swipe gestures,
 * pull-to-refresh, and mobile keyboard optimizations
 * 
 * Validates: Requirements 3.4, 5.6
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { mobile } from '@/lib/utils/mobile-optimization';

// Swipe gesture types
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';
export type SwipeHandler = (direction: SwipeDirection) => void;

interface SwipeGestureProps {
  children: React.ReactNode;
  onSwipe?: SwipeHandler;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * SwipeGesture Component
 * Detects swipe gestures on mobile devices
 */
export function SwipeGesture({
  children,
  onSwipe,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className,
  disabled = false,
}: SwipeGestureProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || !e.touches[0]) return;
    
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, [disabled]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (disabled || !touchStartRef.current || !e.changedTouches[0]) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };

    const deltaX = touchEnd.x - touchStartRef.current.x;
    const deltaY = touchEnd.y - touchStartRef.current.y;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if swipe threshold was met
    if (Math.max(absDeltaX, absDeltaY) < threshold) {
      touchStartRef.current = null;
      return;
    }

    // Determine swipe direction
    let direction: SwipeDirection;
    if (absDeltaX > absDeltaY) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    // Call appropriate handlers
    onSwipe?.(direction);
    
    switch (direction) {
      case 'left':
        onSwipeLeft?.();
        break;
      case 'right':
        onSwipeRight?.();
        break;
      case 'up':
        onSwipeUp?.();
        break;
      case 'down':
        onSwipeDown?.();
        break;
    }

    touchStartRef.current = null;
  }, [disabled, threshold, onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return (
    <div
      ref={elementRef}
      className={cn(
        mobile.gestures.swipeable,
        className
      )}
    >
      {children}
    </div>
  );
}

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
  disabled?: boolean;
  refreshingText?: string;
}

/**
 * PullToRefresh Component
 * Implements pull-to-refresh functionality for mobile
 */
export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className,
  disabled = false,
  refreshingText = 'Atualizando...',
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  
  const elementRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);
  const scrollTopRef = useRef<number>(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || !e.touches[0]) return;
    
    const element = elementRef.current;
    if (!element) return;
    
    scrollTopRef.current = element.scrollTop;
    
    // Only start pull if at top of scroll
    if (scrollTopRef.current === 0) {
      touchStartRef.current = e.touches[0].clientY;
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || touchStartRef.current === null || !e.touches[0]) return;
    
    const element = elementRef.current;
    if (!element || element.scrollTop > 0) {
      touchStartRef.current = null;
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - touchStartRef.current);
    
    if (distance > 10) {
      setIsPulling(true);
      setPullDistance(Math.min(distance, threshold * 1.5));
      
      // Prevent default scrolling when pulling
      e.preventDefault();
    }
  }, [disabled, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing || !isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    touchStartRef.current = null;
  }, [disabled, isRefreshing, isPulling, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const showRefreshIndicator = isPulling || isRefreshing;

  return (
    <div
      ref={elementRef}
      className={cn(
        'relative overflow-auto',
        mobile.gestures.pullToRefresh,
        className
      )}
      style={{
        transform: isPulling ? `translateY(${Math.min(pullDistance * 0.5, 40)}px)` : undefined,
        transition: isPulling ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {/* Refresh Indicator */}
      {showRefreshIndicator && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 bg-solar-50 border-b border-solar-200 z-10"
          style={{
            transform: `translateY(${isPulling ? -40 + (pullDistance * 0.5) : isRefreshing ? 0 : -40}px)`,
            transition: isPulling ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          <div className="flex items-center gap-2 text-solar-600">
            <div
              className={cn(
                'w-5 h-5 border-2 border-solar-600 rounded-full',
                isRefreshing ? 'animate-spin border-t-transparent' : ''
              )}
              style={{
                transform: !isRefreshing ? `rotate(${pullProgress * 360}deg)` : undefined,
              }}
            />
            <span className="text-sm font-medium">
              {isRefreshing ? refreshingText : pullProgress >= 1 ? 'Solte para atualizar' : 'Puxe para atualizar'}
            </span>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
}

interface MobileKeyboardProps {
  children: React.ReactNode;
  adjustViewport?: boolean;
  className?: string;
}

/**
 * MobileKeyboard Component
 * Handles mobile keyboard appearance and viewport adjustments
 */
export function MobileKeyboard({
  children,
  adjustViewport = true,
  className,
}: MobileKeyboardProps) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [, setViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!adjustViewport || typeof window === 'undefined') return;

    const initialHeight = window.visualViewport?.height || window.innerHeight;
    setViewportHeight(initialHeight);

    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialHeight - currentHeight;
      
      // Keyboard is likely visible if viewport height decreased significantly
      const isKeyboardVisible = heightDifference > 150;
      setKeyboardVisible(isKeyboardVisible);
      
      if (isKeyboardVisible) {
        // Adjust viewport to account for keyboard
        document.documentElement.style.setProperty('--keyboard-height', `${heightDifference}px`);
      } else {
        document.documentElement.style.removeProperty('--keyboard-height');
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
        document.documentElement.style.removeProperty('--keyboard-height');
      };
    }

    // Fallback for browsers without visualViewport support
    window.addEventListener('resize', handleViewportChange);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      document.documentElement.style.removeProperty('--keyboard-height');
    };
  }, [adjustViewport]);

  return (
    <div
      className={cn(
        'transition-all duration-300',
        keyboardVisible && adjustViewport && 'pb-[var(--keyboard-height,0px)]',
        className
      )}
      data-keyboard-visible={keyboardVisible}
    >
      {children}
    </div>
  );
}

interface TouchFeedbackProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  haptic?: boolean;
}

/**
 * TouchFeedback Component
 * Provides visual and haptic feedback for touch interactions
 */
export function TouchFeedback({
  children,
  className,
  disabled = false,
  haptic = false,
}: TouchFeedbackProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = useCallback(() => {
    if (disabled) return;
    
    setIsPressed(true);
    
    // Haptic feedback if supported and enabled
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(10); // Short vibration
    }
  }, [disabled, haptic]);

  const handleTouchEnd = useCallback(() => {
    if (disabled) return;
    setIsPressed(false);
  }, [disabled]);

  return (
    <div
      className={cn(
        'transition-transform duration-100',
        isPressed && 'scale-95',
        mobile.performance.touchOptimized,
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {children}
    </div>
  );
}

// Export all components and utilities
export {
  mobile,
};

// Default export for convenience
export default {
  SwipeGesture,
  PullToRefresh,
  MobileKeyboard,
  TouchFeedback,
  mobile,
};