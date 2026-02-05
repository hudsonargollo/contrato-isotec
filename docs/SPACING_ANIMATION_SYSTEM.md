# Spacing and Animation System

This document describes the spacing and animation utilities implemented for the ISOTEC Photovoltaic Contract System design system.

## Overview

The spacing and animation system provides consistent, accessible, and performant utilities for creating smooth user interfaces. The system is built on a 4px base unit for spacing and includes comprehensive animation utilities optimized for web performance.

## Spacing System

### Base Unit

The spacing system uses a **4px base unit** for consistent spacing throughout the application.

```typescript
// Base unit
const SPACING_BASE = 4; // 4px

// Usage
spacing(1) // 4px
spacing(2) // 8px
spacing(4) // 16px
spacing(11) // 44px (minimum touch target)
```

### Available Spacing Values

| Multiplier | Value | Usage |
|------------|-------|-------|
| 0 | 0px | No spacing |
| 0.5 | 2px | Fine adjustments |
| 1 | 4px | Minimal spacing |
| 2 | 8px | Small spacing |
| 3 | 12px | Medium-small spacing |
| 4 | 16px | Standard spacing |
| 6 | 24px | Medium spacing |
| 8 | 32px | Large spacing |
| 11 | 44px | Minimum touch target |
| 12 | 48px | Comfortable touch target |
| 16 | 64px | Extra large spacing |
| 24 | 96px | Section spacing |

### Usage in Tailwind

```html
<!-- Using Tailwind spacing classes -->
<div class="p-4">Padding: 16px</div>
<div class="m-6">Margin: 24px</div>
<div class="space-y-8">Gap: 32px between children</div>

<!-- Using custom spacing values -->
<div class="p-11">Padding: 44px (touch target)</div>
```

### Programmatic Usage

```typescript
import { spacing, SPACING } from '@/lib/design-system';

// Function approach
const padding = spacing(4); // "16px"

// Constants approach
const margin = SPACING[6]; // "24px"

// In styled components
const StyledDiv = styled.div`
  padding: ${spacing(4)};
  margin: ${SPACING[8]};
`;
```

## Animation System

### Animation Classes

The system provides pre-built animation classes for common use cases:

#### Page Transitions
- `animate-fade-in` - Fade in effect
- `animate-fade-out` - Fade out effect
- `animate-slide-up` - Slide up from bottom
- `animate-slide-down` - Slide down from top
- `animate-slide-left` - Slide in from right
- `animate-slide-right` - Slide in from left

#### Micro-interactions
- `animate-bounce-gentle` - Subtle bounce effect
- `animate-scale-in` - Scale in from 95%
- `animate-scale-out` - Scale out to 95%
- `animate-wiggle` - Gentle wiggle animation

#### Loading States
- `animate-spin` - Standard spinner
- `animate-spin-slow` - Slower spinner
- `animate-pulse` - Pulse effect
- `animate-pulse-fast` - Faster pulse
- `animate-skeleton` - Skeleton loading shimmer

#### Hover Effects
- `hover:animate-hover-lift` - Lift on hover
- `hover:animate-hover-glow` - Glow effect on hover

### Animation Durations

```typescript
const ANIMATION_DURATION = {
  instant: '0ms',
  fast: '150ms',      // Quick interactions
  normal: '200ms',    // Standard duration
  medium: '300ms',    // Page transitions
  slow: '500ms',      // Complex animations
  slower: '700ms',    // Emphasis animations
  slowest: '1000ms',  // Special effects
};
```

### Animation Timing Functions

```typescript
const ANIMATION_TIMING = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',      // Material Design
  bounceIn: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  bounceOut: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};
```

### Transition Helpers

#### Basic Transition
```typescript
import { transition } from '@/lib/design-system';

// Default: all properties, 200ms, ease-out
const classes = transition(); // "transition-all duration-200 ease-out"

// Custom: colors only, fast duration, ease-in
const classes = transition('colors', 'fast', 'easeIn');
```

#### Hover Effects
```typescript
import { withHover } from '@/lib/design-system';

const buttonClasses = withHover(
  'bg-blue-500 text-white px-4 py-2 rounded',
  'hover:bg-blue-600 hover:scale-105'
);
```

#### Focus Effects
```typescript
import { withFocus } from '@/lib/design-system';

const inputClasses = withFocus(
  'border-2 border-gray-300 rounded px-3 py-2',
  'focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
);
```

#### Active Effects
```typescript
import { withActive } from '@/lib/design-system';

const buttonClasses = withActive(
  'bg-green-500 text-white px-4 py-2 rounded',
  'active:scale-95 active:bg-green-600'
);
```

## Touch Targets

### Accessibility Requirements

The system ensures all interactive elements meet WCAG 2.1 AA touch target requirements:

```typescript
const TOUCH_TARGET = {
  minimum: '44px',      // WCAG minimum
  comfortable: '48px',  // Recommended
  large: '56px',        // Generous
};
```

### Usage

```html
<!-- Minimum touch target -->
<button class="w-11 h-11 min-w-[44px] min-h-[44px]">
  Icon
</button>

<!-- Comfortable touch target -->
<button class="w-12 h-12 min-w-[48px] min-h-[48px]">
  Icon
</button>
```

## Responsive Breakpoints

```typescript
const BREAKPOINTS = {
  sm: 640,    // Mobile landscape
  md: 768,    // Tablet
  lg: 1024,   // Desktop
  xl: 1280,   // Large desktop
  '2xl': 1536, // Extra large
};
```

### Responsive Helpers

```typescript
import { isBreakpoint, getCurrentBreakpoint } from '@/lib/design-system';

// Check if current viewport matches breakpoint
if (isBreakpoint('lg')) {
  // Desktop layout
}

// Get current breakpoint
const breakpoint = getCurrentBreakpoint(); // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
```

## Performance Considerations

### Animation Optimization

1. **GPU Acceleration**: Animations use `transform` and `opacity` properties for optimal performance
2. **Reduced Motion**: Respects `prefers-reduced-motion` media query
3. **Will-Change**: Applied strategically to avoid overuse

### CSS Classes for Performance

```css
/* GPU acceleration for smooth animations */
.animate-optimized {
  will-change: transform, opacity;
  backface-visibility: hidden;
  perspective: 1000px;
}

/* Disable animations for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Examples

### Button with Hover and Active States

```tsx
import { withHover, withActive } from '@/lib/design-system';

function Button({ children, ...props }) {
  const classes = withActive(
    withHover(
      'px-6 py-3 bg-solar-500 text-white rounded-lg font-medium',
      'hover:bg-solar-600 hover:shadow-lg'
    ),
    'active:scale-95'
  );
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
```

### Card with Lift Animation

```tsx
function Card({ children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1">
      {children}
    </div>
  );
}
```

### Loading Spinner

```tsx
function LoadingSpinner() {
  return (
    <div className="w-8 h-8 border-3 border-gray-200 border-t-solar-500 rounded-full animate-spin" />
  );
}
```

### Page Transition

```tsx
import { motion } from 'framer-motion';

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
```

## Testing

The spacing and animation system includes comprehensive tests:

```bash
# Run design system tests
npm test -- __tests__/design-system.test.ts

# Test specific functionality
npm test -- --testNamePattern="Spacing System"
npm test -- --testNamePattern="Animation System"
```

## Demo

View the interactive demo at `/demo/spacing-animation` to see all utilities in action.

## Best Practices

1. **Consistent Spacing**: Always use the spacing scale values
2. **Performance**: Prefer `transform` and `opacity` for animations
3. **Accessibility**: Ensure touch targets meet minimum 44px requirement
4. **Reduced Motion**: Test with `prefers-reduced-motion: reduce`
5. **Semantic HTML**: Use proper HTML elements with animation enhancements
6. **Progressive Enhancement**: Ensure functionality works without animations

## Migration Guide

### From Custom Spacing

```tsx
// Before
<div style={{ padding: '16px', margin: '24px' }}>

// After
<div className="p-4 m-6">
// or
<div style={{ padding: spacing(4), margin: spacing(6) }}>
```

### From Custom Animations

```tsx
// Before
<div className="custom-fade-in">

// After
<div className="animate-fade-in">
```

This spacing and animation system provides a solid foundation for consistent, accessible, and performant UI animations throughout the ISOTEC application.