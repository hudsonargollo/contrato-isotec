'use client';

/**
 * Keyboard Navigation Utilities
 * 
 * Provides utilities and hooks for implementing keyboard navigation
 * and focus management throughout the application.
 * 
 * Features:
 * - Focus trap for modals and dialogs
 * - Roving tabindex for lists and grids
 * - Keyboard shortcuts management
 * - Focus restoration
 * 
 * Requirements: 11.3
 */

import * as React from 'react';
import { useEffect, useRef, useCallback } from 'react';

// Focus trap hook for modals and dialogs
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previous element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

// Roving tabindex hook for lists and grids
export function useRovingTabIndex<T extends HTMLElement>(
  items: T[],
  orientation: 'horizontal' | 'vertical' | 'both' = 'vertical'
) {
  const [activeIndex, setActiveIndex] = React.useState(0);

  const handleKeyDown = useCallback((e: KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          newIndex = (currentIndex + 1) % items.length;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault();
          newIndex = (currentIndex + 1) % items.length;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault();
          newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        }
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;
    }

    if (newIndex !== currentIndex) {
      setActiveIndex(newIndex);
      items[newIndex]?.focus();
    }
  }, [items, orientation]);

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    getTabIndex: (index: number) => index === activeIndex ? 0 : -1,
  };
}

// Keyboard shortcuts hook
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Create key combination string
      const keys = [];
      if (e.ctrlKey) keys.push('ctrl');
      if (e.altKey) keys.push('alt');
      if (e.shiftKey) keys.push('shift');
      if (e.metaKey) keys.push('meta');
      keys.push(e.key.toLowerCase());
      
      const combination = keys.join('+');
      
      if (shortcuts[combination]) {
        e.preventDefault();
        shortcuts[combination]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Skip link component for accessibility
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className = '' }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={`
        sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
        bg-solar-500 text-neutral-900 px-4 py-2 rounded-lg font-medium
        focus:outline-none focus:ring-2 focus:ring-solar-500/50 focus:ring-offset-2
        z-50 transition-all duration-200
        ${className}
      `}
    >
      {children}
    </a>
  );
}

// Focus management utilities
export const focusUtils = {
  // Get all focusable elements within a container
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const selector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(selector));
  },

  // Focus first focusable element
  focusFirst: (container: HTMLElement): boolean => {
    const focusable = focusUtils.getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[0].focus();
      return true;
    }
    return false;
  },

  // Focus last focusable element
  focusLast: (container: HTMLElement): boolean => {
    const focusable = focusUtils.getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[focusable.length - 1].focus();
      return true;
    }
    return false;
  },

  // Check if element is focusable
  isFocusable: (element: HTMLElement): boolean => {
    const focusable = focusUtils.getFocusableElements(element.parentElement || document.body);
    return focusable.includes(element);
  },

  // Restore focus to a previously focused element
  restoreFocus: (element: HTMLElement | null) => {
    if (element && document.contains(element)) {
      element.focus();
    }
  },
};

// Announcement utility for screen readers
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;
  
  document.body.appendChild(announcer);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
}

// Custom hook for managing focus within a component
export function useFocusManagement() {
  const containerRef = useRef<HTMLElement>(null);

  const focusFirst = useCallback(() => {
    if (containerRef.current) {
      return focusUtils.focusFirst(containerRef.current);
    }
    return false;
  }, []);

  const focusLast = useCallback(() => {
    if (containerRef.current) {
      return focusUtils.focusLast(containerRef.current);
    }
    return false;
  }, []);

  const getFocusableElements = useCallback(() => {
    if (containerRef.current) {
      return focusUtils.getFocusableElements(containerRef.current);
    }
    return [];
  }, []);

  return {
    containerRef,
    focusFirst,
    focusLast,
    getFocusableElements,
  };
}

// Escape key handler hook
export function useEscapeKey(callback: () => void, isActive: boolean = true) {
  useEffect(() => {
    if (!isActive) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [callback, isActive]);
}