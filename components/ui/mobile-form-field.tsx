/**
 * Mobile-Optimized Form Field Component
 * 
 * Form field component optimized for mobile keyboards and touch interaction
 * Validates: Requirements 3.4, 5.6
 */

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { mobile } from '@/lib/utils/mobile-optimization';

interface MobileFormFieldProps extends InputProps {
  autoScrollOnFocus?: boolean;
  preventZoom?: boolean;
  mobileKeyboardType?: 'default' | 'numeric' | 'email' | 'phone' | 'url' | 'search';
}

/**
 * Mobile keyboard type mapping
 */
const KEYBOARD_TYPE_MAP = {
  default: { inputMode: 'text' as const, type: 'text' },
  numeric: { inputMode: 'numeric' as const, type: 'number' },
  email: { inputMode: 'email' as const, type: 'email' },
  phone: { inputMode: 'tel' as const, type: 'tel' },
  url: { inputMode: 'url' as const, type: 'url' },
  search: { inputMode: 'search' as const, type: 'search' },
} as const;

/**
 * MobileFormField Component
 * Optimized form field for mobile devices with proper keyboard handling
 */
export function MobileFormField({
  autoScrollOnFocus = true,
  preventZoom = true,
  mobileKeyboardType = 'default',
  className,
  onFocus,
  onBlur,
  ...props
}: MobileFormFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Get keyboard configuration
  const keyboardConfig = KEYBOARD_TYPE_MAP[mobileKeyboardType];

  // Handle viewport changes for keyboard detection
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleViewportChange = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const heightDifference = windowHeight - viewportHeight;
      
      // Keyboard is likely visible if viewport height decreased significantly
      const isKeyboardVisible = heightDifference > 150;
      setKeyboardVisible(isKeyboardVisible);
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  // Auto-scroll to input when focused on mobile
  const scrollToInput = () => {
    if (!autoScrollOnFocus || !inputRef.current || !mobile.viewport.isMobile()) return;

    setTimeout(() => {
      inputRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }, 300); // Delay to allow keyboard animation
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    scrollToInput();
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <div
      className={cn(
        'relative transition-all duration-300',
        keyboardVisible && 'mb-4', // Add margin when keyboard is visible
        className
      )}
    >
      <Input
        ref={inputRef}
        {...props}
        {...keyboardConfig}
        className={cn(
          mobile.formField(),
          // Prevent zoom on iOS by ensuring 16px font size
          preventZoom && 'text-base',
          // Add visual feedback for mobile focus
          isFocused && mobile.viewport.isMobile() && 'ring-2 ring-solar-500/20',
          className
        )}
        onFocus={handleFocus}
        onBlur={handleBlur}
        // Mobile-specific attributes
        autoComplete={props.autoComplete || 'off'}
        autoCapitalize={props.autoCapitalize || 'none'}
        autoCorrect={props.autoCorrect || 'off'}
        spellCheck={props.spellCheck || false}
      />
      
      {/* Mobile keyboard indicator */}
      {isFocused && keyboardVisible && (
        <div className="absolute -bottom-8 left-0 right-0 flex justify-center">
          <div className="bg-solar-500 text-white text-xs px-2 py-1 rounded-full">
            Teclado ativo
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Mobile-optimized form container
 */
interface MobileFormProps {
  children: React.ReactNode;
  className?: string;
  adjustForKeyboard?: boolean;
}

export function MobileForm({
  children,
  className,
  adjustForKeyboard = true,
}: MobileFormProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!adjustForKeyboard || typeof window === 'undefined') return;

    const handleViewportChange = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const heightDifference = windowHeight - viewportHeight;
      
      setKeyboardHeight(Math.max(0, heightDifference));
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
      };
    }

    // Fallback for browsers without visualViewport
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = window.screen.height - currentHeight;
      setKeyboardHeight(Math.max(0, heightDifference - 100)); // Account for browser UI
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [adjustForKeyboard]);

  return (
    <div
      className={cn(
        'transition-all duration-300',
        mobile.spacing('form'),
        className
      )}
      style={{
        paddingBottom: keyboardHeight > 0 ? `${Math.min(keyboardHeight, 300)}px` : undefined,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Mobile input types with proper keyboard optimization
 */
export const MobileInputTypes = {
  Email: (props: Omit<MobileFormFieldProps, 'mobileKeyboardType'>) => (
    <MobileFormField {...props} mobileKeyboardType="email" />
  ),
  
  Phone: (props: Omit<MobileFormFieldProps, 'mobileKeyboardType'>) => (
    <MobileFormField {...props} mobileKeyboardType="phone" />
  ),
  
  Number: (props: Omit<MobileFormFieldProps, 'mobileKeyboardType'>) => (
    <MobileFormField {...props} mobileKeyboardType="numeric" />
  ),
  
  URL: (props: Omit<MobileFormFieldProps, 'mobileKeyboardType'>) => (
    <MobileFormField {...props} mobileKeyboardType="url" />
  ),
  
  Search: (props: Omit<MobileFormFieldProps, 'mobileKeyboardType'>) => (
    <MobileFormField {...props} mobileKeyboardType="search" />
  ),
};

export default MobileFormField;