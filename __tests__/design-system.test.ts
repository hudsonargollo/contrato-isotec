/**
 * Design System Utilities Tests
 * 
 * Tests for spacing calculations, animation helpers, and responsive utilities.
 */

import {
  spacing,
  SPACING,
  ANIMATION_DURATION,
  ANIMATION_TIMING,
  BREAKPOINTS,
  TOUCH_TARGET,
  isBreakpoint,
  getCurrentBreakpoint,
  transition,
  withHover,
  withFocus,
  withActive,
  designSystem,
} from '../lib/design-system';

describe('Design System Utilities', () => {
  describe('Spacing System', () => {
    test('spacing function calculates correct values', () => {
      expect(spacing(0)).toBe('0px');
      expect(spacing(1)).toBe('4px');
      expect(spacing(2)).toBe('8px');
      expect(spacing(4)).toBe('16px');
      expect(spacing(11)).toBe('44px'); // Minimum touch target
      expect(spacing(12)).toBe('48px');
    });

    test('SPACING constants match expected values', () => {
      expect(SPACING[0]).toBe('0px');
      expect(SPACING[1]).toBe('4px');
      expect(SPACING[2]).toBe('8px');
      expect(SPACING[4]).toBe('16px');
      expect(SPACING[11]).toBe('44px'); // Minimum touch target
      expect(SPACING[12]).toBe('48px');
      expect(SPACING[24]).toBe('96px');
    });

    test('spacing follows 4px base unit', () => {
      const testValues = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];
      
      testValues.forEach(multiplier => {
        const expected = `${multiplier * 4}px`;
        expect(spacing(multiplier)).toBe(expected);
        expect(SPACING[multiplier as keyof typeof SPACING]).toBe(expected);
      });
    });
  });

  describe('Animation System', () => {
    test('animation durations are defined', () => {
      expect(ANIMATION_DURATION.instant).toBe('0ms');
      expect(ANIMATION_DURATION.fast).toBe('150ms');
      expect(ANIMATION_DURATION.normal).toBe('200ms');
      expect(ANIMATION_DURATION.medium).toBe('300ms');
      expect(ANIMATION_DURATION.slow).toBe('500ms');
    });

    test('animation timing functions are defined', () => {
      expect(ANIMATION_TIMING.linear).toBe('linear');
      expect(ANIMATION_TIMING.ease).toBe('ease');
      expect(ANIMATION_TIMING.smooth).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
      expect(ANIMATION_TIMING.bounceIn).toBe('cubic-bezier(0.68, -0.55, 0.265, 1.55)');
    });
  });

  describe('Responsive System', () => {
    test('breakpoints are defined correctly', () => {
      expect(BREAKPOINTS.sm).toBe(640);
      expect(BREAKPOINTS.md).toBe(768);
      expect(BREAKPOINTS.lg).toBe(1024);
      expect(BREAKPOINTS.xl).toBe(1280);
      expect(BREAKPOINTS['2xl']).toBe(1536);
    });

    test('getCurrentBreakpoint returns correct values', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });
      expect(getCurrentBreakpoint()).toBe('xs');

      window.innerWidth = 640;
      expect(getCurrentBreakpoint()).toBe('sm');

      window.innerWidth = 768;
      expect(getCurrentBreakpoint()).toBe('md');

      window.innerWidth = 1024;
      expect(getCurrentBreakpoint()).toBe('lg');

      window.innerWidth = 1280;
      expect(getCurrentBreakpoint()).toBe('xl');

      window.innerWidth = 1536;
      expect(getCurrentBreakpoint()).toBe('2xl');
    });

    test('isBreakpoint works correctly', () => {
      window.innerWidth = 1024;
      expect(isBreakpoint('lg')).toBe(true);
      expect(isBreakpoint('xl')).toBe(false);
      expect(isBreakpoint('md')).toBe(true);
      expect(isBreakpoint('sm')).toBe(true);
    });
  });

  describe('Touch Target System', () => {
    test('touch target sizes meet accessibility requirements', () => {
      expect(TOUCH_TARGET.minimum).toBe('44px'); // WCAG minimum
      expect(TOUCH_TARGET.comfortable).toBe('48px');
      expect(TOUCH_TARGET.large).toBe('56px');
    });

    test('minimum touch target is at least 44px', () => {
      const minSize = parseInt(TOUCH_TARGET.minimum);
      expect(minSize).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Transition Helpers', () => {
    test('transition function creates correct class strings', () => {
      expect(transition()).toBe('transition-all duration-200 ease-out');
      expect(transition('colors', 'fast', 'easeIn')).toBe('transition-colors duration-150 ease-in');
      expect(transition('transform', 'slow', 'smooth')).toBe('transition-transform duration-500 ease-smooth');
    });

    test('withHover creates correct class strings', () => {
      const result = withHover('bg-blue-500', 'hover:bg-blue-600');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('hover:bg-blue-600');
      expect(result).toContain('transition-all');
      expect(result).toContain('duration-200');
      expect(result).toContain('ease-out');
    });

    test('withFocus creates correct class strings', () => {
      const result = withFocus('border-gray-300', 'focus:border-blue-500');
      expect(result).toContain('border-gray-300');
      expect(result).toContain('focus:border-blue-500');
      expect(result).toContain('transition-all');
    });

    test('withActive creates correct class strings', () => {
      const result = withActive('scale-100', 'active:scale-95');
      expect(result).toContain('scale-100');
      expect(result).toContain('active:scale-95');
      expect(result).toContain('transition-transform');
      expect(result).toContain('duration-150');
    });
  });

  describe('Design System Export', () => {
    test('designSystem object contains all utilities', () => {
      expect(designSystem.spacing).toBeDefined();
      expect(designSystem.animation).toBeDefined();
      expect(designSystem.transition).toBeDefined();
      expect(designSystem.breakpoints).toBeDefined();
      expect(designSystem.touchTarget).toBeDefined();
      expect(designSystem.shadows).toBeDefined();
      expect(designSystem.borderRadius).toBeDefined();
      expect(designSystem.zIndex).toBeDefined();
      expect(designSystem.helpers).toBeDefined();
    });

    test('helpers are accessible through designSystem', () => {
      expect(designSystem.helpers.spacing).toBe(spacing);
      expect(designSystem.helpers.isBreakpoint).toBe(isBreakpoint);
      expect(designSystem.helpers.getCurrentBreakpoint).toBe(getCurrentBreakpoint);
    });

    test('transition helpers are accessible', () => {
      expect(designSystem.transition.helpers.transition).toBe(transition);
      expect(designSystem.transition.helpers.withHover).toBe(withHover);
      expect(designSystem.transition.helpers.withFocus).toBe(withFocus);
      expect(designSystem.transition.helpers.withActive).toBe(withActive);
    });
  });

  describe('Edge Cases', () => {
    test('spacing handles decimal values', () => {
      expect(spacing(0.5)).toBe('2px');
      expect(spacing(1.5)).toBe('6px');
      expect(spacing(2.5)).toBe('10px');
    });

    test('spacing handles zero and negative values', () => {
      expect(spacing(0)).toBe('0px');
      expect(spacing(-1)).toBe('-4px');
      expect(spacing(-2)).toBe('-8px');
    });

    test('getCurrentBreakpoint handles server-side rendering', () => {
      // Mock window as undefined (SSR)
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      expect(getCurrentBreakpoint()).toBe('xs');
      
      // Restore window
      global.window = originalWindow;
    });

    test('isBreakpoint handles server-side rendering', () => {
      // Mock window as undefined (SSR)
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      expect(isBreakpoint('lg')).toBe(false);
      
      // Restore window
      global.window = originalWindow;
    });
  });
});

describe('Animation Performance', () => {
  test('animation durations are reasonable for UX', () => {
    const fastDuration = parseInt(ANIMATION_DURATION.fast);
    const normalDuration = parseInt(ANIMATION_DURATION.normal);
    const mediumDuration = parseInt(ANIMATION_DURATION.medium);
    
    // Fast animations should be under 200ms
    expect(fastDuration).toBeLessThan(200);
    
    // Normal animations should be around 200ms
    expect(normalDuration).toBeLessThanOrEqual(300);
    
    // Medium animations should be under 500ms
    expect(mediumDuration).toBeLessThanOrEqual(500);
  });

  test('timing functions use proper cubic-bezier values', () => {
    // Smooth timing function should be the standard material design curve
    expect(ANIMATION_TIMING.smooth).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
    
    // Bounce timing functions should have appropriate values
    expect(ANIMATION_TIMING.bounceIn).toContain('cubic-bezier');
    expect(ANIMATION_TIMING.bounceOut).toContain('cubic-bezier');
  });
});

describe('Accessibility Compliance', () => {
  test('minimum touch target meets WCAG guidelines', () => {
    const minTouchTarget = parseInt(TOUCH_TARGET.minimum);
    
    // WCAG 2.1 AA requires minimum 44x44px touch targets
    expect(minTouchTarget).toBeGreaterThanOrEqual(44);
  });

  test('spacing scale supports proper touch targets', () => {
    const spacing11 = parseInt(SPACING[11]);
    
    // Spacing unit 11 should provide minimum touch target
    expect(spacing11).toBeGreaterThanOrEqual(44);
  });
});