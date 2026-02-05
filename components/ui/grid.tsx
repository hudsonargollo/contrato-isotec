/**
 * Grid Component
 * Responsive grid layout component that adapts to different viewport sizes
 * Provides 1-column layout for mobile, 2-column for tablet, and 3-column for desktop
 * with configurable gap spacing
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /**
   * Number of columns for different breakpoints
   * - mobile: 1 column (default)
   * - tablet: 2 columns (default)
   * - desktop: 3 columns (default)
   * - auto: automatically fit columns based on content
   * - custom: use custom column configuration
   */
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  } | 'auto' | number;
  /**
   * Gap spacing between grid items
   * - none: no gap
   * - sm: gap-2 (8px)
   * - md: gap-4 (16px) - default
   * - lg: gap-6 (24px)
   * - xl: gap-8 (32px)
   * - 2xl: gap-12 (48px)
   */
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /**
   * Alignment of grid items
   * - start: items-start
   * - center: items-center
   * - end: items-end
   * - stretch: items-stretch (default)
   */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /**
   * Justification of grid items
   * - start: justify-items-start
   * - center: justify-items-center
   * - end: justify-items-end
   * - stretch: justify-items-stretch (default)
   */
  justify?: 'start' | 'center' | 'end' | 'stretch';
  /**
   * Whether to make all grid items equal height
   */
  equalHeight?: boolean;
}

const gridGapVariants = {
  none: '',
  sm: 'gap-2',     // 8px
  md: 'gap-4',     // 16px
  lg: 'gap-6',     // 24px
  xl: 'gap-8',     // 32px
  '2xl': 'gap-12', // 48px
};

const gridAlignVariants = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const gridJustifyVariants = {
  start: 'justify-items-start',
  center: 'justify-items-center',
  end: 'justify-items-end',
  stretch: 'justify-items-stretch',
};

/**
 * Generate responsive grid column classes based on configuration
 */
function getGridColumnClasses(columns: GridProps['columns']): string {
  if (typeof columns === 'number') {
    // Fixed number of columns across all breakpoints
    return `grid-cols-${Math.min(columns, 12)}`;
  }
  
  if (columns === 'auto') {
    // Auto-fit columns based on content
    return 'grid-cols-[repeat(auto-fit,minmax(250px,1fr))]';
  }
  
  if (typeof columns === 'object') {
    // Custom responsive configuration
    const mobile = columns.mobile || 1;
    const tablet = columns.tablet || 2;
    const desktop = columns.desktop || 3;
    
    return cn(
      `grid-cols-${mobile}`,           // Mobile: 1 column (default)
      `md:grid-cols-${tablet}`,        // Tablet: 2 columns (default)
      `lg:grid-cols-${desktop}`        // Desktop: 3 columns (default)
    );
  }
  
  // Default responsive behavior: 1 -> 2 -> 3 columns
  return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
}

export function Grid({
  children,
  className,
  columns,
  gap = 'md',
  align = 'stretch',
  justify = 'stretch',
  equalHeight = false,
  ...props
}: GridProps) {
  const gridColumnClasses = getGridColumnClasses(columns);
  
  return (
    <div
      className={cn(
        // Base grid styles
        'grid',
        
        // Responsive columns
        gridColumnClasses,
        
        // Gap spacing
        gridGapVariants[gap],
        
        // Item alignment
        gridAlignVariants[align],
        
        // Item justification
        gridJustifyVariants[justify],
        
        // Equal height items
        equalHeight && 'auto-rows-fr',
        
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
 * Grid Item Component
 * Individual item within a grid with optional span configuration
 */
interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /**
   * Number of columns this item should span
   * - number: span specific number of columns
   * - full: span all columns
   * - auto: auto span based on content
   */
  span?: number | 'full' | 'auto';
  /**
   * Number of rows this item should span
   */
  rowSpan?: number | 'full' | 'auto';
  /**
   * Column start position (1-based)
   */
  colStart?: number;
  /**
   * Row start position (1-based)
   */
  rowStart?: number;
}

function getSpanClasses(span: GridItemProps['span'], type: 'col' | 'row'): string {
  if (!span) return '';
  
  const prefix = type === 'col' ? 'col-span' : 'row-span';
  
  if (span === 'full') {
    return `${prefix}-full`;
  }
  
  if (span === 'auto') {
    return `${prefix}-auto`;
  }
  
  if (typeof span === 'number') {
    return `${prefix}-${Math.min(span, 12)}`;
  }
  
  return '';
}

function getStartClasses(start: number | undefined, type: 'col' | 'row'): string {
  if (!start) return '';
  
  const prefix = type === 'col' ? 'col-start' : 'row-start';
  return `${prefix}-${Math.min(start, 13)}`;
}

export function GridItem({
  children,
  className,
  span,
  rowSpan,
  colStart,
  rowStart,
  ...props
}: GridItemProps) {
  return (
    <div
      className={cn(
        // Span classes
        getSpanClasses(span, 'col'),
        getSpanClasses(rowSpan, 'row'),
        
        // Start position classes
        getStartClasses(colStart, 'col'),
        getStartClasses(rowStart, 'row'),
        
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
 * Responsive Grid - A specialized grid with predefined responsive behavior
 * Optimized for common use cases with sensible defaults
 */
interface ResponsiveGridProps extends Omit<GridProps, 'columns'> {
  /**
   * Responsive behavior preset
   * - cards: 1 -> 2 -> 3 columns (default)
   * - features: 1 -> 2 -> 4 columns
   * - gallery: 2 -> 3 -> 4 columns
   * - list: 1 -> 1 -> 2 columns
   * - stats: 2 -> 3 -> 4 columns
   */
  variant?: 'cards' | 'features' | 'gallery' | 'list' | 'stats';
}

const responsiveVariants = {
  cards: { mobile: 1, tablet: 2, desktop: 3 },
  features: { mobile: 1, tablet: 2, desktop: 4 },
  gallery: { mobile: 2, tablet: 3, desktop: 4 },
  list: { mobile: 1, tablet: 1, desktop: 2 },
  stats: { mobile: 2, tablet: 3, desktop: 4 },
};

export function ResponsiveGrid({
  variant = 'cards',
  ...props
}: ResponsiveGridProps) {
  return (
    <Grid
      columns={responsiveVariants[variant]}
      {...props}
    />
  );
}

/**
 * Auto Grid - A grid that automatically fits columns based on content width
 * Useful for dynamic content where column count should adapt to content
 */
interface AutoGridProps extends Omit<GridProps, 'columns'> {
  /**
   * Minimum width for each column
   * - sm: 200px
   * - md: 250px (default)
   * - lg: 300px
   * - xl: 350px
   */
  minColumnWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const minWidthVariants = {
  sm: 'grid-cols-[repeat(auto-fit,minmax(200px,1fr))]',
  md: 'grid-cols-[repeat(auto-fit,minmax(250px,1fr))]',
  lg: 'grid-cols-[repeat(auto-fit,minmax(300px,1fr))]',
  xl: 'grid-cols-[repeat(auto-fit,minmax(350px,1fr))]',
};

export function AutoGrid({
  minColumnWidth = 'md',
  className,
  ...props
}: AutoGridProps) {
  return (
    <div
      className={cn(
        // Base grid styles
        'grid',
        
        // Auto-fit columns with minimum width
        minWidthVariants[minColumnWidth],
        
        // Gap spacing
        gridGapVariants[props.gap || 'md'],
        
        // Item alignment
        gridAlignVariants[props.align || 'stretch'],
        
        // Item justification
        gridJustifyVariants[props.justify || 'stretch'],
        
        // Equal height items
        props.equalHeight && 'auto-rows-fr',
        
        // Custom className
        className
      )}
      {...(props as React.HTMLAttributes<HTMLDivElement>)}
    >
      {props.children}
    </div>
  );
}

/**
 * Masonry Grid - A grid that creates a masonry/Pinterest-style layout
 * Items flow naturally based on their height
 */
interface MasonryGridProps extends Omit<GridProps, 'columns' | 'equalHeight'> {
  /**
   * Number of columns for different breakpoints
   */
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export function MasonryGrid({
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  className,
  ...props
}: MasonryGridProps) {
  const mobile = columns.mobile || 1;
  const tablet = columns.tablet || 2;
  const desktop = columns.desktop || 3;
  
  return (
    <div
      className={cn(
        // Masonry layout using CSS columns
        `columns-${mobile}`,
        `md:columns-${tablet}`,
        `lg:columns-${desktop}`,
        
        // Gap spacing (using column-gap for masonry)
        props.gap === 'none' ? '' : 
        props.gap === 'sm' ? 'gap-2' :
        props.gap === 'lg' ? 'gap-6' :
        props.gap === 'xl' ? 'gap-8' :
        props.gap === '2xl' ? 'gap-12' :
        'gap-4', // default md
        
        // Custom className
        className
      )}
      {...(props as React.HTMLAttributes<HTMLDivElement>)}
    >
      {React.Children.map(props.children, (child, index) => (
        <div
          key={index}
          className="break-inside-avoid mb-4"
        >
          {child}
        </div>
      ))}
    </div>
  );
}

export default Grid;