import React from 'react';
import { cn } from '@/lib/utils';

interface ReadableTextProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'prose' | 'narrow' | 'wide' | 'full';
  spacing?: 'tight' | 'normal' | 'relaxed';
  contrast?: 'high' | 'medium' | 'low';
}

/**
 * ReadableText component ensures optimal readability with proper line lengths,
 * spacing, and contrast ratios according to Requirements 10.2, 10.3, 10.5
 */
export const ReadableText: React.FC<ReadableTextProps> = ({
  children,
  className,
  maxWidth = 'prose',
  spacing = 'normal',
  contrast = 'medium',
  ...props
}) => {
  const maxWidthClasses = {
    prose: 'max-w-[75ch]', // Optimal reading line length
    narrow: 'max-w-[60ch]',
    wide: 'max-w-[85ch]',
    full: 'max-w-none',
  };

  const spacingClasses = {
    tight: 'leading-normal', // 1.5
    normal: 'leading-relaxed', // 1.625
    relaxed: 'leading-loose', // 2
  };

  const contrastClasses = {
    high: 'text-high-contrast',
    medium: 'text-medium-contrast',
    low: 'text-low-contrast',
  };

  return (
    <div
      className={cn(
        'text-readable',
        maxWidthClasses[maxWidth],
        spacingClasses[spacing],
        contrastClasses[contrast],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface ReadableParagraphProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'base' | 'lg';
  contrast?: 'high' | 'medium' | 'low';
}

/**
 * ReadableParagraph component with optimized spacing and mobile adjustments
 */
export const ReadableParagraph: React.FC<ReadableParagraphProps> = ({
  children,
  className,
  size = 'base',
  contrast = 'medium',
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-sm md:text-base',
    base: 'text-base md:text-lg',
    lg: 'text-lg md:text-xl',
  };

  const contrastClasses = {
    high: 'text-high-contrast',
    medium: 'text-medium-contrast',
    low: 'text-low-contrast',
  };

  return (
    <p
      className={cn(
        'max-w-[75ch] mb-5 md:mb-6',
        sizeClasses[size],
        'leading-relaxed', // Apply line height after size classes
        contrastClasses[contrast],
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
};

interface ReadableHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  contrast?: 'high' | 'medium' | 'low';
}

/**
 * ReadableHeading component with proper hierarchy and contrast
 */
export const ReadableHeading: React.FC<ReadableHeadingProps> = ({
  level,
  children,
  className,
  contrast = 'high',
  ...props
}) => {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  
  const contrastClasses = {
    high: 'text-high-contrast',
    medium: 'text-medium-contrast',
    low: 'text-low-contrast',
  };

  return (
    <Tag className={cn(contrastClasses[contrast], className)} {...props}>
      {children}
    </Tag>
  );
};