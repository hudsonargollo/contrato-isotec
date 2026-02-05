/**
 * Design System Utilities
 * 
 * This file provides utility functions and constants for the ISOTEC design system,
 * including spacing calculations, animation helpers, and responsive utilities.
 */

// Spacing system based on 4px base unit
export const SPACING_BASE = 4; // 4px base unit

/**
 * Calculate spacing value based on multiplier
 * @param multiplier - Number to multiply by base unit (4px)
 * @returns Spacing value in pixels
 */
export function spacing(multiplier: number): string {
  return `${multiplier * SPACING_BASE}px`;
}

/**
 * Spacing scale constants for consistent usage
 */
export const SPACING = {
  0: '0px',
  0.5: spacing(0.5),   // 2px
  1: spacing(1),       // 4px
  1.5: spacing(1.5),   // 6px
  2: spacing(2),       // 8px
  2.5: spacing(2.5),   // 10px
  3: spacing(3),       // 12px
  3.5: spacing(3.5),   // 14px
  4: spacing(4),       // 16px
  5: spacing(5),       // 20px
  6: spacing(6),       // 24px
  7: spacing(7),       // 28px
  8: spacing(8),       // 32px
  9: spacing(9),       // 36px
  10: spacing(10),     // 40px
  11: spacing(11),     // 44px (minimum touch target)
  12: spacing(12),     // 48px
  14: spacing(14),     // 56px
  16: spacing(16),     // 64px
  20: spacing(20),     // 80px
  24: spacing(24),     // 96px
  28: spacing(28),     // 112px
  32: spacing(32),     // 128px
  36: spacing(36),     // 144px
  40: spacing(40),     // 160px
  44: spacing(44),     // 176px
  48: spacing(48),     // 192px
  52: spacing(52),     // 208px
  56: spacing(56),     // 224px
  60: spacing(60),     // 240px
  64: spacing(64),     // 256px
  72: spacing(72),     // 288px
  80: spacing(80),     // 320px
  96: spacing(96),     // 384px
} as const;

/**
 * Animation duration constants
 */
export const ANIMATION_DURATION = {
  instant: '0ms',
  fast: '150ms',
  normal: '200ms',
  medium: '300ms',
  slow: '500ms',
  slower: '700ms',
  slowest: '1000ms',
} as const;

/**
 * Animation timing functions
 */
export const ANIMATION_TIMING = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  bounceIn: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  bounceOut: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  smoothIn: 'cubic-bezier(0.4, 0, 1, 1)',
  smoothOut: 'cubic-bezier(0, 0, 0.2, 1)',
  smoothInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

/**
 * Responsive breakpoints
 */
export const BREAKPOINTS = {
  sm: 640,   // Mobile landscape
  md: 768,   // Tablet
  lg: 1024,  // Desktop
  xl: 1280,  // Large desktop
  '2xl': 1536, // Extra large
} as const;

/**
 * Check if current viewport matches breakpoint
 * @param breakpoint - Breakpoint name
 * @returns Boolean indicating if viewport matches
 */
export function isBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS[breakpoint];
}

/**
 * Get current breakpoint name
 * @returns Current breakpoint name
 */
export function getCurrentBreakpoint(): keyof typeof BREAKPOINTS | 'xs' {
  if (typeof window === 'undefined') return 'xs';
  
  const width = window.innerWidth;
  
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/**
 * Touch target size constants (minimum 44x44px for accessibility)
 */
export const TOUCH_TARGET = {
  minimum: spacing(11), // 44px
  comfortable: spacing(12), // 48px
  large: spacing(14), // 56px
} as const;

/**
 * Common animation classes for consistent usage
 */
export const ANIMATION_CLASSES = {
  // Page transitions
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  slideLeft: 'animate-slide-left',
  slideRight: 'animate-slide-right',
  
  // Micro-interactions
  bounceGentle: 'animate-bounce-gentle',
  scaleIn: 'animate-scale-in',
  scaleOut: 'animate-scale-out',
  wiggle: 'animate-wiggle',
  
  // Loading states
  spin: 'animate-spin',
  spinSlow: 'animate-spin-slow',
  pulse: 'animate-pulse',
  pulseFast: 'animate-pulse-fast',
  pulseSlow: 'animate-pulse-slow',
  skeleton: 'animate-skeleton',
  
  // Hover effects
  hoverLift: 'hover:animate-hover-lift',
  hoverGlow: 'hover:animate-hover-glow',
  
  // Float animation (for mascot)
  float: 'animate-float',
  
  // Success states
  successBounce: 'animate-success-bounce',
} as const;

/**
 * Common transition classes
 */
export const TRANSITION_CLASSES = {
  all: 'transition-all',
  colors: 'transition-colors',
  opacity: 'transition-opacity',
  shadow: 'transition-shadow',
  transform: 'transition-transform',
  
  // Durations
  fast: 'duration-150',
  normal: 'duration-200',
  medium: 'duration-300',
  slow: 'duration-500',
  
  // Timing functions
  ease: 'ease-linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  bounceIn: 'ease-bounce-in',
  bounceOut: 'ease-bounce-out',
  smooth: 'ease-smooth',
} as const;

/**
 * Helper function to combine transition classes
 * @param property - CSS property to transition
 * @param duration - Duration of transition
 * @param timing - Timing function
 * @returns Combined class string
 */
export function transition(
  property: keyof typeof TRANSITION_CLASSES = 'all',
  duration: 'fast' | 'normal' | 'medium' | 'slow' = 'normal',
  timing: 'ease' | 'easeIn' | 'easeOut' | 'easeInOut' | 'smooth' = 'easeOut'
): string {
  return `${TRANSITION_CLASSES[property]} ${TRANSITION_CLASSES[duration]} ${TRANSITION_CLASSES[timing]}`;
}

/**
 * Helper function to create hover effects
 * @param baseClasses - Base classes for the element
 * @param hoverClasses - Classes to apply on hover
 * @returns Combined class string with transition
 */
export function withHover(baseClasses: string, hoverClasses: string): string {
  return `${baseClasses} ${transition()} ${hoverClasses}`;
}

/**
 * Helper function to create focus effects
 * @param baseClasses - Base classes for the element
 * @param focusClasses - Classes to apply on focus
 * @returns Combined class string with transition
 */
export function withFocus(baseClasses: string, focusClasses: string): string {
  return `${baseClasses} ${transition()} ${focusClasses}`;
}

/**
 * Helper function to create active effects
 * @param baseClasses - Base classes for the element
 * @param activeClasses - Classes to apply when active
 * @returns Combined class string with transition
 */
export function withActive(baseClasses: string, activeClasses: string): string {
  return `${baseClasses} ${transition('transform', 'fast')} ${activeClasses}`;
}

/**
 * Common shadow utilities
 */
export const SHADOWS = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  base: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  inner: 'shadow-inner',
  
  // Colored shadows for brand elements
  solar: 'shadow-lg shadow-solar-500/30',
  ocean: 'shadow-lg shadow-ocean-500/30',
  energy: 'shadow-lg shadow-energy-500/30',
} as const;

/**
 * Common border radius utilities
 */
export const BORDER_RADIUS = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  base: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
} as const;

/**
 * Z-index scale for consistent layering
 */
export const Z_INDEX = {
  hide: '-z-10',
  auto: 'z-auto',
  base: 'z-0',
  docked: 'z-10',
  dropdown: 'z-20',
  sticky: 'z-30',
  banner: 'z-40',
  overlay: 'z-50',
  modal: 'z-60',
  popover: 'z-70',
  skipLink: 'z-80',
  toast: 'z-90',
  tooltip: 'z-100',
} as const;

/**
 * Export all utilities as a single object for easy importing
 */
export const designSystem = {
  spacing: SPACING,
  animation: {
    duration: ANIMATION_DURATION,
    timing: ANIMATION_TIMING,
    classes: ANIMATION_CLASSES,
  },
  transition: {
    classes: TRANSITION_CLASSES,
    helpers: { transition, withHover, withFocus, withActive },
  },
  breakpoints: BREAKPOINTS,
  touchTarget: TOUCH_TARGET,
  shadows: SHADOWS,
  borderRadius: BORDER_RADIUS,
  zIndex: Z_INDEX,
  helpers: {
    spacing,
    isBreakpoint,
    getCurrentBreakpoint,
  },
} as const;

export default designSystem;