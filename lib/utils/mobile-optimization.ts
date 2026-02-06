/**
 * Mobile Optimization Utilities
 * 
 * Utilities for ensuring mobile-first design, touch targets, and responsive behavior
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Minimum touch target size constants (44x44px as per Apple/Google guidelines)
 */
export const TOUCH_TARGET = {
  MIN_SIZE: 44, // 44px minimum
  RECOMMENDED_SIZE: 48, // 48px recommended
  SPACING: 8, // 8px minimum spacing between targets
} as const;

/**
 * Responsive breakpoints matching Tailwind defaults
 */
export const BREAKPOINTS = {
  sm: 640,   // Mobile landscape
  md: 768,   // Tablet
  lg: 1024,  // Desktop
  xl: 1280,  // Large desktop
  '2xl': 1536, // Extra large
} as const;

/**
 * Viewport size categories
 */
export const VIEWPORT_CATEGORIES = {
  MOBILE_SMALL: 320,    // Small mobile (iPhone SE)
  MOBILE_STANDARD: 375, // Standard mobile (iPhone)
  TABLET: 768,          // Tablet
  DESKTOP: 1024,        // Desktop
  DESKTOP_LARGE: 1920,  // Large desktop
} as const;

/**
 * Touch target size classes for different components
 */
export const touchTargetClasses = {
  // Button touch targets
  button: {
    sm: 'min-h-[44px] min-w-[44px] px-3 py-2',
    default: 'min-h-[48px] min-w-[48px] px-4 py-3',
    lg: 'min-h-[52px] min-w-[52px] px-6 py-3',
    xl: 'min-h-[56px] min-w-[56px] px-8 py-4',
  },
  
  // Input touch targets
  input: {
    sm: 'min-h-[44px] px-3 py-2',
    default: 'min-h-[48px] px-4 py-3',
    lg: 'min-h-[52px] px-5 py-3',
  },
  
  // Interactive card/clickable areas
  interactive: {
    sm: 'min-h-[44px] p-3',
    default: 'min-h-[48px] p-4',
    lg: 'min-h-[52px] p-6',
  },
  
  // Navigation items
  nav: {
    default: 'min-h-[48px] px-4 py-3',
    lg: 'min-h-[52px] px-6 py-4',
  },
} as const;

/**
 * Mobile-specific spacing classes
 */
export const mobileSpacing = {
  // Touch target spacing (minimum 8px between targets)
  touchSpacing: 'gap-2 md:gap-3',
  
  // Container padding for mobile
  containerPadding: 'px-4 sm:px-6 md:px-8',
  
  // Section spacing
  sectionSpacing: 'space-y-6 md:space-y-8 lg:space-y-12',
  
  // Form field spacing
  formSpacing: 'space-y-4 md:space-y-6',
} as const;

/**
 * Responsive text size classes
 */
export const responsiveText = {
  // Headings
  h1: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl',
  h2: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
  h3: 'text-lg sm:text-xl md:text-2xl lg:text-3xl',
  h4: 'text-base sm:text-lg md:text-xl lg:text-2xl',
  
  // Body text
  body: 'text-sm sm:text-base md:text-lg',
  bodyLarge: 'text-base sm:text-lg md:text-xl',
  
  // Small text
  small: 'text-xs sm:text-sm',
  caption: 'text-xs',
} as const;

/**
 * Mobile-optimized grid classes
 */
export const responsiveGrid = {
  // Standard responsive grids
  cols1to2: 'grid-cols-1 md:grid-cols-2',
  cols1to3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  cols1to4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  
  // Form grids
  formGrid: 'grid-cols-1 md:grid-cols-2 gap-4 md:gap-6',
  
  // Card grids with proper spacing
  cardGrid: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6',
} as const;

/**
 * Mobile-first utility function
 * Combines classes with mobile-first approach
 */
export function mobileFirst(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Touch target utility
 * Ensures minimum touch target size for interactive elements
 */
export function touchTarget(size: 'sm' | 'default' | 'lg' | 'xl' = 'default') {
  const sizeMap = {
    sm: 'min-h-[44px] min-w-[44px]',
    default: 'min-h-[48px] min-w-[48px]',
    lg: 'min-h-[52px] min-w-[52px]',
    xl: 'min-h-[56px] min-w-[56px]',
  };
  
  return mobileFirst(
    sizeMap[size],
    'flex items-center justify-center',
    'touch-manipulation', // Optimize for touch
    'select-none' // Prevent text selection on touch
  );
}

/**
 * Mobile container utility
 * Provides responsive container with proper padding
 */
export function mobileContainer(size: 'sm' | 'default' | 'lg' | 'xl' = 'default') {
  const sizeMap = {
    sm: 'max-w-sm',
    default: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
  };
  
  return mobileFirst(
    'w-full mx-auto',
    sizeMap[size],
    mobileSpacing.containerPadding
  );
}

/**
 * Mobile form field utility
 * Optimizes form fields for mobile input
 */
export function mobileFormField() {
  return mobileFirst(
    touchTargetClasses.input.default,
    'text-base', // Prevent zoom on iOS
    'rounded-lg',
    'transition-all duration-200'
  );
}

/**
 * Mobile button utility
 * Optimizes buttons for touch interaction
 */
export function mobileButton(size: 'sm' | 'default' | 'lg' | 'xl' = 'default') {
  return mobileFirst(
    touchTargetClasses.button[size],
    'rounded-lg',
    'font-medium',
    'transition-all duration-200',
    'active:scale-95', // Touch feedback
    'touch-manipulation'
  );
}

/**
 * Mobile card utility
 * Optimizes cards for mobile viewing and interaction
 */
export function mobileCard(interactive: boolean = false) {
  const baseClasses = mobileFirst(
    'rounded-xl',
    'border',
    'bg-white',
    'shadow-sm',
    'transition-all duration-200'
  );
  
  if (interactive) {
    return mobileFirst(
      baseClasses,
      touchTargetClasses.interactive.default,
      'cursor-pointer',
      'hover:shadow-md',
      'active:scale-[0.98]',
      'touch-manipulation'
    );
  }
  
  return baseClasses;
}

/**
 * Responsive spacing utility
 * Provides consistent spacing across breakpoints
 */
export function responsiveSpacing(type: 'section' | 'form' | 'touch' = 'section') {
  const spacingMap = {
    section: mobileSpacing.sectionSpacing,
    form: mobileSpacing.formSpacing,
    touch: mobileSpacing.touchSpacing,
  };
  
  return spacingMap[type];
}

/**
 * Mobile navigation utility
 * Optimizes navigation for mobile devices
 */
export function mobileNavigation() {
  return mobileFirst(
    touchTargetClasses.nav.default,
    'flex items-center',
    'transition-all duration-200',
    'touch-manipulation'
  );
}

/**
 * Viewport detection utilities
 */
export const viewport = {
  /**
   * Check if current viewport is mobile
   */
  isMobile: () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < BREAKPOINTS.md;
  },
  
  /**
   * Check if current viewport is tablet
   */
  isTablet: () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg;
  },
  
  /**
   * Check if current viewport is desktop
   */
  isDesktop: () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= BREAKPOINTS.lg;
  },
  
  /**
   * Get current viewport category
   */
  getCategory: () => {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    
    if (width < VIEWPORT_CATEGORIES.MOBILE_STANDARD) return 'mobile-small';
    if (width < VIEWPORT_CATEGORIES.TABLET) return 'mobile';
    if (width < VIEWPORT_CATEGORIES.DESKTOP) return 'tablet';
    if (width < VIEWPORT_CATEGORIES.DESKTOP_LARGE) return 'desktop';
    return 'desktop-large';
  },
};

/**
 * Mobile gesture utilities
 */
export const gestures = {
  /**
   * Swipe gesture classes
   */
  swipeable: mobileFirst(
    'touch-pan-x', // Allow horizontal panning
    'select-none',
    'cursor-grab',
    'active:cursor-grabbing'
  ),
  
  /**
   * Pull-to-refresh classes
   */
  pullToRefresh: mobileFirst(
    'touch-pan-y', // Allow vertical panning
    'overscroll-behavior-y-contain'
  ),
  
  /**
   * Scroll snap classes
   */
  scrollSnap: mobileFirst(
    'scroll-smooth',
    'snap-x snap-mandatory',
    'overflow-x-auto'
  ),
};

/**
 * Mobile accessibility utilities
 */
export const a11y = {
  /**
   * Screen reader only classes
   */
  srOnly: 'sr-only',
  
  /**
   * Focus visible classes for mobile
   */
  focusVisible: mobileFirst(
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-solar-500',
    'focus-visible:ring-offset-2'
  ),
  
  /**
   * High contrast mode support
   */
  highContrast: mobileFirst(
    'contrast-more:border-2',
    'contrast-more:border-current'
  ),
};

/**
 * Performance optimization utilities
 */
export const performance = {
  /**
   * GPU acceleration for animations
   */
  gpuAccelerated: 'transform-gpu',
  
  /**
   * Optimize for touch devices
   */
  touchOptimized: mobileFirst(
    'touch-manipulation',
    'will-change-transform'
  ),
  
  /**
   * Reduce motion for accessibility
   */
  respectMotion: 'motion-reduce:transition-none motion-reduce:animate-none',
};

/**
 * Export all utilities as a single object for easy importing
 */
export const mobile = {
  touchTarget,
  container: mobileContainer,
  formField: mobileFormField,
  button: mobileButton,
  card: mobileCard,
  spacing: responsiveSpacing,
  navigation: mobileNavigation,
  viewport,
  gestures,
  a11y,
  performance,
  
  // Class collections
  classes: {
    touchTarget: touchTargetClasses,
    spacing: mobileSpacing,
    text: responsiveText,
    grid: responsiveGrid,
  },
} as const;

export default mobile;