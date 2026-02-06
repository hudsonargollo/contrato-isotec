/**
 * Loading Spinner Component
 * 
 * A customizable loading spinner with solar theme colors and size variants.
 * Supports different sizes (sm, md, lg) and color themes.
 * 
 * Requirements: 8.1
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const spinnerVariants = cva(
  // Base styles - rotation animation and border styling
  'animate-spin rounded-full border-2 border-solid border-current border-r-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 border-2',
        md: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-[3px]',
        xl: 'h-12 w-12 border-[3px]',
      },
      variant: {
        // Solar theme - primary brand color
        solar: 'text-solar-500',
        // Ocean theme - secondary brand color
        ocean: 'text-ocean-500',
        // Energy theme - accent color
        energy: 'text-energy-500',
        // Neutral theme - for subtle contexts
        neutral: 'text-neutral-400',
        // White theme - for dark backgrounds
        white: 'text-white',
        // Current color - inherits from parent
        current: 'text-current',
      },
      speed: {
        slow: 'animate-spin-slow', // 2s duration
        normal: 'animate-spin',    // 1s duration (default)
        fast: 'animate-pulse',     // 0.5s duration
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'solar',
      speed: 'normal',
    },
  }
);

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  /**
   * Screen reader text for accessibility
   */
  srText?: string;
}

/**
 * LoadingSpinner component with solar theme colors and size variants
 */
const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, variant, speed, srText = 'Loading...', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(spinnerVariants({ size, variant, speed }), className)}
        role="status"
        aria-label={srText}
        {...props}
      >
        <span className="sr-only">{srText}</span>
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * Centered loading spinner with optional text
 */
export interface CenteredSpinnerProps extends LoadingSpinnerProps {
  /**
   * Optional text to display below the spinner
   */
  text?: string;
  /**
   * Container className for the centered wrapper
   */
  containerClassName?: string;
}

const CenteredSpinner = React.forwardRef<HTMLDivElement, CenteredSpinnerProps>(
  ({ text, containerClassName, ...spinnerProps }, ref) => {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 p-8',
          containerClassName
        )}
      >
        <LoadingSpinner ref={ref} {...spinnerProps} />
        {text && (
          <p className="text-sm text-neutral-600 animate-pulse">
            {text}
          </p>
        )}
      </div>
    );
  }
);

CenteredSpinner.displayName = 'CenteredSpinner';

/**
 * Inline loading spinner for buttons and small spaces
 */
export interface InlineSpinnerProps extends Omit<LoadingSpinnerProps, 'size'> {
  /**
   * Size is automatically set to 'sm' for inline usage
   */
  size?: 'sm';
}

const InlineSpinner = React.forwardRef<HTMLDivElement, InlineSpinnerProps>(
  ({ size = 'sm', ...props }, ref) => {
    return <LoadingSpinner ref={ref} size={size} {...props} />;
  }
);

InlineSpinner.displayName = 'InlineSpinner';

/**
 * Loading overlay component that covers its parent
 */
export interface LoadingOverlayProps extends CenteredSpinnerProps {
  /**
   * Whether the overlay is visible
   */
  visible: boolean;
  /**
   * Background opacity (0-100)
   */
  opacity?: number;
  /**
   * Background color
   */
  background?: 'white' | 'black' | 'transparent';
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ 
    visible, 
    opacity = 80, 
    background = 'white', 
    containerClassName,
    ...spinnerProps 
  }, ref) => {
    if (!visible) return null;

    const backgroundClasses = {
      white: `bg-white/${opacity}`,
      black: `bg-black/${opacity}`,
      transparent: 'bg-transparent',
    };

    return (
      <div
        className={cn(
          'absolute inset-0 z-50 flex items-center justify-center',
          backgroundClasses[background],
          'backdrop-blur-sm',
          containerClassName
        )}
      >
        <CenteredSpinner ref={ref} {...spinnerProps} />
      </div>
    );
  }
);

LoadingOverlay.displayName = 'LoadingOverlay';

export { 
  LoadingSpinner, 
  CenteredSpinner, 
  InlineSpinner, 
  LoadingOverlay,
  spinnerVariants 
};