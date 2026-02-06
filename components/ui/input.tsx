/**
 * Enhanced Input Component
 * A premium input component with focus states, validation feedback, and floating labels
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  // Base styles with enhanced focus states and transitions
  'flex w-full rounded-lg border-2 bg-white px-4 py-3 text-base transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400 touch-manipulation',
  {
    variants: {
      variant: {
        default: [
          'border-neutral-200',
          'text-neutral-900',
          'focus-visible:border-solar-500',
          'focus-visible:ring-4 focus-visible:ring-solar-500/10',
          'hover:border-neutral-300',
        ],
        error: [
          'border-red-500',
          'text-neutral-900',
          'focus-visible:border-red-500',
          'focus-visible:ring-4 focus-visible:ring-red-500/10',
          'bg-red-50/50',
        ],
        success: [
          'border-energy-500',
          'text-neutral-900',
          'focus-visible:border-energy-500',
          'focus-visible:ring-4 focus-visible:ring-energy-500/10',
          'bg-energy-50/50',
        ],
      },
      size: {
        sm: 'min-h-[44px] h-11 px-3 py-2 text-base', // Minimum touch target, base text size to prevent zoom
        default: 'min-h-[48px] h-12 px-4 py-3 text-base', // Recommended touch target
        lg: 'min-h-[52px] h-13 px-5 py-3 text-lg', // Large touch target
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  floatingLabel?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    variant, 
    size, 
    label, 
    error, 
    success, 
    helperText, 
    floatingLabel = false,
    icon,
    rightIcon,
    placeholder,
    value,
    id,
    ...props 
  }, ref) => {
    const [focused, setFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(Boolean(value));
    
    // Generate unique ID for accessibility
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    
    // Determine the actual variant based on error/success states
    const actualVariant = error ? 'error' : success ? 'success' : variant;
    
    // Handle floating label logic
    const showFloatingLabel = floatingLabel && (focused || hasValue || placeholder);
    
    React.useEffect(() => {
      setHasValue(Boolean(value));
    }, [value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      setHasValue(Boolean(e.target.value));
      props.onBlur?.(e);
    };

    const inputElement = (
      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}
        
        {/* Floating Label */}
        {floatingLabel && label && (
          <label
            htmlFor={inputId}
            className={cn(
              'absolute left-4 transition-all duration-200 pointer-events-none',
              showFloatingLabel
                ? 'top-2 text-xs text-solar-600 font-medium'
                : 'top-1/2 -translate-y-1/2 text-base text-neutral-400',
              icon && 'left-10'
            )}
          >
            {label}
          </label>
        )}
        
        {/* Input Field */}
        <input
          type={type}
          id={inputId}
          className={cn(
            inputVariants({ variant: actualVariant, size, className }),
            icon && 'pl-10',
            (rightIcon || error || success) && 'pr-10',
            floatingLabel && showFloatingLabel && 'pt-6 pb-2'
          )}
          ref={ref}
          value={value}
          placeholder={floatingLabel ? '' : placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-describedby={cn(
            error && errorId,
            (success || helperText) && !error && helperId
          )}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
        
        {/* Right Icon or Status Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {error && (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          {success && !error && (
            <CheckCircle2 className="h-5 w-5 text-energy-500" />
          )}
          {!error && !success && rightIcon && (
            <div className="text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>
      </div>
    );

    // If not using floating label, wrap with traditional label
    if (!floatingLabel && label) {
      return (
        <div className="space-y-2">
          <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
            {label}
          </label>
          {inputElement}
          {/* Helper Text, Error, or Success Message */}
          {(error || success || helperText) && (
            <div className="flex items-start gap-1">
              {error && (
                <p id={errorId} className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {error}
                </p>
              )}
              {success && !error && (
                <p id={helperId} className="text-sm text-energy-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {success}
                </p>
              )}
              {!error && !success && helperText && (
                <p id={helperId} className="text-sm text-neutral-500">{helperText}</p>
              )}
            </div>
          )}
        </div>
      );
    }

    // Return just the input element for floating label or no label
    return (
      <div className="space-y-2">
        {inputElement}
        {/* Helper Text, Error, or Success Message */}
        {(error || success || helperText) && (
          <div className="flex items-start gap-1">
            {error && (
              <p id={errorId} className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {error}
              </p>
            )}
            {success && !error && (
              <p id={helperId} className="text-sm text-energy-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {success}
              </p>
            )}
            {!error && !success && helperText && (
              <p id={helperId} className="text-sm text-neutral-500">{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
