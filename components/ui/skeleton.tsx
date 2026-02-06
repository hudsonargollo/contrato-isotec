/**
 * Skeleton Loader Components
 * 
 * Skeleton loaders for different UI elements including cards, tables, and forms.
 * Provides smooth pulse animation and consistent styling.
 * 
 * Requirements: 8.1, 8.4
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const skeletonVariants = cva(
  // Base skeleton styles with pulse animation
  'animate-skeleton bg-neutral-200 rounded',
  {
    variants: {
      variant: {
        default: 'bg-neutral-200',
        light: 'bg-neutral-100',
        dark: 'bg-neutral-300',
        solar: 'bg-solar-100',
        ocean: 'bg-ocean-100',
      },
      speed: {
        slow: 'animate-pulse-slow',   // 3s duration
        normal: 'animate-skeleton',   // 1.5s duration (default)
        fast: 'animate-pulse-fast',   // 1s duration
      },
    },
    defaultVariants: {
      variant: 'default',
      speed: 'normal',
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

/**
 * Base Skeleton component
 */
const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, speed, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, speed }), className)}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * Text skeleton with different line heights
 */
export interface SkeletonTextProps extends SkeletonProps {
  /**
   * Number of lines to display
   */
  lines?: number;
  /**
   * Text size variant
   */
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  /**
   * Width of the last line (percentage)
   */
  lastLineWidth?: number;
}

const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ 
    lines = 1, 
    size = 'base', 
    lastLineWidth = 75, 
    className, 
    ...props 
  }, ref) => {
    const sizeClasses = {
      xs: 'h-3',
      sm: 'h-4',
      base: 'h-4',
      lg: 'h-5',
      xl: 'h-5',
      '2xl': 'h-6',
      '3xl': 'h-7',
    };

    const lineHeight = sizeClasses[size];

    if (lines === 1) {
      return (
        <Skeleton
          ref={ref}
          className={cn(lineHeight, 'w-full', className)}
          {...props}
        />
      );
    }

    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            className={cn(
              lineHeight,
              index === lines - 1 ? `w-[${lastLineWidth}%]` : 'w-full'
            )}
            {...props}
          />
        ))}
      </div>
    );
  }
);

SkeletonText.displayName = 'SkeletonText';

/**
 * Card skeleton loader
 */
export interface SkeletonCardProps extends SkeletonProps {
  /**
   * Whether to show an avatar/image placeholder
   */
  showAvatar?: boolean;
  /**
   * Whether to show action buttons
   */
  showActions?: boolean;
  /**
   * Number of content lines
   */
  contentLines?: number;
}

const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ 
    showAvatar = false, 
    showActions = false, 
    contentLines = 3, 
    className, 
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'p-6 border border-neutral-200 rounded-xl bg-white space-y-4',
          className
        )}
      >
        {/* Header with optional avatar */}
        <div className="flex items-center space-x-4">
          {showAvatar && (
            <Skeleton className="h-12 w-12 rounded-full" {...props} />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" {...props} />
            <Skeleton className="h-3 w-1/2" {...props} />
          </div>
        </div>

        {/* Content lines */}
        <div className="space-y-2">
          {Array.from({ length: contentLines }).map((_, index) => (
            <Skeleton
              key={index}
              className={cn(
                'h-4',
                index === contentLines - 1 ? 'w-2/3' : 'w-full'
              )}
              {...props}
            />
          ))}
        </div>

        {/* Optional actions */}
        {showActions && (
          <div className="flex space-x-2 pt-2">
            <Skeleton className="h-9 w-20" {...props} />
            <Skeleton className="h-9 w-16" {...props} />
          </div>
        )}
      </div>
    );
  }
);

SkeletonCard.displayName = 'SkeletonCard';

/**
 * Table skeleton loader
 */
export interface SkeletonTableProps extends SkeletonProps {
  /**
   * Number of rows to display
   */
  rows?: number;
  /**
   * Number of columns to display
   */
  columns?: number;
  /**
   * Whether to show table header
   */
  showHeader?: boolean;
}

const SkeletonTable = React.forwardRef<HTMLDivElement, SkeletonTableProps>(
  ({ 
    rows = 5, 
    columns = 4, 
    showHeader = true, 
    className, 
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('w-full border border-neutral-200 rounded-lg overflow-hidden', className)}
      >
        {/* Table header */}
        {showHeader && (
          <div className="bg-neutral-50 p-4 border-b border-neutral-200">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, index) => (
                <Skeleton key={`header-${index}`} className="h-4 w-3/4" {...props} />
              ))}
            </div>
          </div>
        )}

        {/* Table rows */}
        <div className="divide-y divide-neutral-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={`row-${rowIndex}`} className="p-4">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Skeleton
                    key={`cell-${rowIndex}-${colIndex}`}
                    className={cn(
                      'h-4',
                      colIndex === 0 ? 'w-full' : 'w-2/3' // First column full width, others shorter
                    )}
                    {...props}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

SkeletonTable.displayName = 'SkeletonTable';

/**
 * Form skeleton loader
 */
export interface SkeletonFormProps extends SkeletonProps {
  /**
   * Number of form fields to display
   */
  fields?: number;
  /**
   * Whether to show form title
   */
  showTitle?: boolean;
  /**
   * Whether to show submit button
   */
  showSubmit?: boolean;
}

const SkeletonForm = React.forwardRef<HTMLDivElement, SkeletonFormProps>(
  ({ 
    fields = 4, 
    showTitle = true, 
    showSubmit = true, 
    className, 
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-6 p-6 bg-white border border-neutral-200 rounded-xl', className)}
      >
        {/* Form title */}
        {showTitle && (
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/3" {...props} />
            <Skeleton className="h-4 w-2/3" {...props} />
          </div>
        )}

        {/* Form fields */}
        <div className="space-y-4">
          {Array.from({ length: fields }).map((_, index) => (
            <div key={`field-${index}`} className="space-y-2">
              {/* Field label */}
              <Skeleton className="h-4 w-1/4" {...props} />
              {/* Field input */}
              <Skeleton className="h-10 w-full rounded-md" {...props} />
            </div>
          ))}
        </div>

        {/* Submit button */}
        {showSubmit && (
          <div className="pt-4">
            <Skeleton className="h-10 w-32" {...props} />
          </div>
        )}
      </div>
    );
  }
);

SkeletonForm.displayName = 'SkeletonForm';

/**
 * List skeleton loader
 */
export interface SkeletonListProps extends SkeletonProps {
  /**
   * Number of list items
   */
  items?: number;
  /**
   * Whether to show avatars/icons
   */
  showAvatars?: boolean;
}

const SkeletonList = React.forwardRef<HTMLDivElement, SkeletonListProps>(
  ({ items = 5, showAvatars = false, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-3', className)}>
        {Array.from({ length: items }).map((_, index) => (
          <div key={`item-${index}`} className="flex items-center space-x-3 p-3">
            {showAvatars && (
              <Skeleton className="h-10 w-10 rounded-full" {...props} />
            )}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" {...props} />
              <Skeleton className="h-3 w-1/2" {...props} />
            </div>
          </div>
        ))}
      </div>
    );
  }
);

SkeletonList.displayName = 'SkeletonList';

/**
 * Avatar skeleton
 */
export interface SkeletonAvatarProps extends SkeletonProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SkeletonAvatar = React.forwardRef<HTMLDivElement, SkeletonAvatarProps>(
  ({ size = 'md', className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
      xl: 'h-16 w-16',
    };

    return (
      <Skeleton
        ref={ref}
        className={cn(sizeClasses[size], 'rounded-full', className)}
        {...props}
      />
    );
  }
);

SkeletonAvatar.displayName = 'SkeletonAvatar';

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonForm,
  SkeletonList,
  SkeletonAvatar,
  skeletonVariants,
};