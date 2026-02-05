/**
 * Container Component
 * Responsive container with max-width constraints and padding for different breakpoints
 * Provides consistent layout constraints across different viewport sizes
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /**
   * Size variant for different max-width constraints
   * - sm: max-w-screen-sm (640px)
   * - md: max-w-screen-md (768px) 
   * - lg: max-w-screen-lg (1024px)
   * - xl: max-w-screen-xl (1280px)
   * - 2xl: max-w-screen-2xl (1536px)
   * - full: max-w-full (no constraint)
   * - none: no max-width applied
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'none';
  /**
   * Padding variant for responsive spacing
   * - none: no padding
   * - sm: px-4 py-2 (mobile), px-6 py-4 (tablet+)
   * - md: px-4 py-4 (mobile), px-8 py-6 (tablet+)
   * - lg: px-6 py-6 (mobile), px-12 py-8 (tablet+)
   * - xl: px-8 py-8 (mobile), px-16 py-12 (tablet+)
   */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Whether to center the container horizontally
   */
  centered?: boolean;
}

const containerSizeVariants = {
  sm: 'max-w-screen-sm',     // 640px
  md: 'max-w-screen-md',     // 768px
  lg: 'max-w-screen-lg',     // 1024px
  xl: 'max-w-screen-xl',     // 1280px
  '2xl': 'max-w-screen-2xl', // 1536px
  full: 'max-w-full',
  none: '',
};

const containerPaddingVariants = {
  none: '',
  sm: 'px-4 py-2 md:px-6 md:py-4',
  md: 'px-4 py-4 md:px-8 md:py-6',
  lg: 'px-6 py-6 md:px-12 md:py-8',
  xl: 'px-8 py-8 md:px-16 md:py-12',
};

export function Container({
  children,
  className,
  size = 'xl',
  padding = 'md',
  centered = true,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        // Base container styles
        'w-full',
        
        // Max-width constraints
        containerSizeVariants[size],
        
        // Responsive padding
        containerPaddingVariants[padding],
        
        // Centering
        centered && 'mx-auto',
        
        // Custom className
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Section Container - A specialized container for page sections
 * Provides consistent spacing and layout for major page sections
 */
export function SectionContainer({
  children,
  className,
  size = 'xl',
  padding = 'lg',
  centered = true,
  ...props
}: ContainerProps) {
  return (
    <Container
      size={size}
      padding={padding}
      centered={centered}
      className={cn(
        // Section-specific styles
        'relative',
        className
      )}
      {...props}
    >
      {children}
    </Container>
  );
}

/**
 * Content Container - A specialized container for main content areas
 * Optimized for readability with appropriate line lengths
 */
export function ContentContainer({
  children,
  className,
  ...props
}: Omit<ContainerProps, 'size'>) {
  return (
    <Container
      size="lg"
      className={cn(
        // Content-specific styles for optimal readability
        'prose prose-neutral',
        className
      )}
      {...props}
    >
      {children}
    </Container>
  );
}

/**
 * Narrow Container - A specialized container for forms and focused content
 * Provides a narrower max-width for better form UX
 */
export function NarrowContainer({
  children,
  className,
  ...props
}: Omit<ContainerProps, 'size'>) {
  return (
    <div
      className={cn(
        // Base container styles
        'w-full',
        
        // Narrow container specific max-width
        'max-w-2xl',
        
        // Responsive padding (default md)
        containerPaddingVariants[props.padding || 'md'],
        
        // Centering (default true)
        (props.centered !== false) && 'mx-auto',
        
        // Custom className
        className
      )}
      {...(props as React.HTMLAttributes<HTMLDivElement>)}
    >
      {children}
    </div>
  );
}

export default Container;