/**
 * Enhanced Button Component
 * A premium button component with solar gradient, multiple variants, and loading states
 * Validates: Requirements 1.1, 1.3, 11.1, 11.2, 11.4
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles with enhanced transitions and accessibility
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed active:scale-95 touch-manipulation select-none',
  {
    variants: {
      variant: {
        // Primary - Solar gradient with premium styling
        primary: [
          'bg-gradient-to-r from-solar-500 to-solar-600',
          'text-white',
          'shadow-lg shadow-solar-500/30',
          'hover:from-solar-600 hover:to-solar-700',
          'hover:shadow-xl hover:shadow-solar-500/40',
          'focus-visible:ring-solar-500',
          'disabled:from-neutral-300 disabled:to-neutral-400',
          'disabled:shadow-none disabled:text-neutral-500',
        ],
        
        // Secondary - Professional ocean blue
        secondary: [
          'bg-ocean-500',
          'text-white',
          'shadow-md shadow-ocean-500/20',
          'hover:bg-ocean-600',
          'hover:shadow-lg hover:shadow-ocean-500/30',
          'focus-visible:ring-ocean-500',
          'disabled:bg-neutral-300 disabled:text-neutral-500',
          'disabled:shadow-none',
        ],
        
        // Outline - Subtle with solar accent
        outline: [
          'border-2 border-solar-500',
          'text-solar-600',
          'bg-transparent',
          'hover:bg-solar-50',
          'hover:border-solar-600',
          'hover:text-solar-700',
          'focus-visible:ring-solar-500',
          'disabled:border-neutral-300 disabled:text-neutral-400',
          'disabled:hover:bg-transparent',
        ],
        
        // Ghost - Minimal with hover effects
        ghost: [
          'text-neutral-700',
          'bg-transparent',
          'hover:bg-neutral-100',
          'hover:text-neutral-900',
          'focus-visible:ring-neutral-500',
          'disabled:text-neutral-400',
          'disabled:hover:bg-transparent',
        ],
      },
      size: {
        sm: 'min-h-[44px] h-11 px-3 text-sm min-w-[44px]', // Minimum 44px touch target
        default: 'min-h-[48px] h-12 px-4 py-2 text-base min-w-[48px]', // Recommended 48px touch target
        lg: 'min-h-[52px] h-13 px-6 text-lg min-w-[52px]', // Large touch target
        xl: 'min-h-[56px] h-14 px-8 text-xl min-w-[56px]', // Extra large touch target
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function Button({
  variant,
  size,
  className,
  children,
  loading = false,
  loadingText,
  disabled,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...restProps
}: ButtonProps) {
  const isDisabled = disabled || loading;
  
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      {...restProps}
    >
      {loading && (
        <Loader2 
          className={cn(
            'animate-spin',
            size === 'sm' ? 'h-3 w-3' : 
            size === 'lg' ? 'h-5 w-5' :
            size === 'xl' ? 'h-6 w-6' : 'h-4 w-4'
          )}
          aria-hidden="true"
        />
      )}
      {loading ? (loadingText || 'Loading...') : children}
    </button>
  );
}

export { buttonVariants };
