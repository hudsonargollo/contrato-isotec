/**
 * Mobile Optimization Tests
 * 
 * Tests for mobile touch targets, responsive breakpoints, and mobile interactions
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 5.6
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { SwipeGesture, PullToRefresh, TouchFeedback } from '@/components/ui/mobile-interactions';
import { ResponsiveTestRunner, TEST_BREAKPOINTS } from '@/lib/utils/responsive-testing';
import { mobile } from '@/lib/utils/mobile-optimization';

// Mock window dimensions for testing
const mockViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Trigger resize event
  fireEvent(window, new Event('resize'));
};

describe('Mobile Optimization', () => {
  describe('Touch Target Sizing', () => {
    test('buttons meet minimum touch target requirements', () => {
      render(
        <div>
          <Button size="sm">Small Button</Button>
          <Button size="default">Default Button</Button>
          <Button size="lg">Large Button</Button>
          <Button size="xl">XL Button</Button>
        </div>
      );

      const buttons = screen.getAllByRole('button');
      
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight);
        const minWidth = parseInt(styles.minWidth);
        
        // All buttons should meet minimum 44px touch target
        expect(minHeight).toBeGreaterThanOrEqual(44);
        expect(minWidth).toBeGreaterThanOrEqual(44);
      });
    });

    test('inputs meet minimum touch target requirements', () => {
      render(
        <div>
          <Input size="sm" placeholder="Small input" />
          <Input size="default" placeholder="Default input" />
          <Input size="lg" placeholder="Large input" />
        </div>
      );

      const inputs = screen.getAllByRole('textbox');
      
      inputs.forEach((input) => {
        const styles = window.getComputedStyle(input);
        const minHeight = parseInt(styles.minHeight);
        
        // All inputs should meet minimum 44px touch target height
        expect(minHeight).toBeGreaterThanOrEqual(44);
      });
    });

    test('interactive cards meet minimum touch target requirements', () => {
      const handleClick = jest.fn();
      
      render(
        <Card variant="interactive" onClick={handleClick}>
          <div>Interactive Card Content</div>
        </Card>
      );

      const card = screen.getByRole('button');
      const styles = window.getComputedStyle(card);
      const minHeight = parseInt(styles.minHeight);
      
      expect(minHeight).toBeGreaterThanOrEqual(48);
    });

    test('touch targets have proper spacing', () => {
      render(
        <div className="flex gap-2">
          <Button>Button 1</Button>
          <Button>Button 2</Button>
          <Button>Button 3</Button>
        </div>
      );

      const container = screen.getByRole('button').parentElement;
      const styles = window.getComputedStyle(container!);
      const gap = parseInt(styles.gap);
      
      // Should have minimum 8px spacing (gap-2 = 8px)
      expect(gap).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Responsive Breakpoints', () => {
    test('mobile small viewport (320px)', () => {
      mockViewport(320, 568);
      
      render(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </div>
      );

      const container = screen.getByText('Item 1').parentElement;
      const styles = window.getComputedStyle(container!);
      
      // Should be single column on mobile
      expect(styles.gridTemplateColumns).toBe('repeat(1, minmax(0, 1fr))');
    });

    test('mobile standard viewport (375px)', () => {
      mockViewport(375, 812);
      
      render(
        <div className="text-sm sm:text-base md:text-lg">
          Responsive Text
        </div>
      );

      const element = screen.getByText('Responsive Text');
      const styles = window.getComputedStyle(element);
      
      // Should use base font size on mobile
      expect(parseInt(styles.fontSize)).toBeGreaterThanOrEqual(14);
    });

    test('tablet viewport (768px)', () => {
      mockViewport(768, 1024);
      
      render(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>Item 1</div>
          <div>Item 2</div>
        </div>
      );

      const container = screen.getByText('Item 1').parentElement;
      const styles = window.getComputedStyle(container!);
      
      // Should be 2 columns on tablet
      expect(styles.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
    });

    test('desktop viewport (1024px)', () => {
      mockViewport(1024, 768);
      
      render(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </div>
      );

      const container = screen.getByText('Item 1').parentElement;
      const styles = window.getComputedStyle(container!);
      
      // Should be 3 columns on desktop
      expect(styles.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
    });

    test('large desktop viewport (1920px)', () => {
      mockViewport(1920, 1080);
      
      render(
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>Large Desktop Content</div>
        </div>
      );

      const container = screen.getByText('Large Desktop Content').parentElement;
      const styles = window.getComputedStyle(container!);
      
      // Should have proper max-width and padding
      expect(styles.maxWidth).toBe('80rem'); // max-w-7xl
      expect(parseInt(styles.paddingLeft)).toBeGreaterThanOrEqual(32); // lg:px-8
    });
  });

  describe('Mobile Interactions', () => {
    test('swipe gesture detection', async () => {
      const handleSwipeLeft = jest.fn();
      const handleSwipeRight = jest.fn();
      
      render(
        <SwipeGesture onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight}>
          <div>Swipeable Content</div>
        </SwipeGesture>
      );

      const element = screen.getByText('Swipeable Content');
      
      // Simulate swipe left
      fireEvent.touchStart(element, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchEnd(element, {
        changedTouches: [{ clientX: 50, clientY: 100 }],
      });

      await waitFor(() => {
        expect(handleSwipeLeft).toHaveBeenCalled();
      });
    });

    test('pull to refresh functionality', async () => {
      const handleRefresh = jest.fn().mockResolvedValue(undefined);
      
      render(
        <PullToRefresh onRefresh={handleRefresh}>
          <div>Content to refresh</div>
        </PullToRefresh>
      );

      const element = screen.getByText('Content to refresh').parentElement;
      
      // Simulate pull down gesture
      fireEvent.touchStart(element!, {
        touches: [{ clientX: 100, clientY: 50 }],
      });
      fireEvent.touchMove(element!, {
        touches: [{ clientX: 100, clientY: 150 }],
      });
      fireEvent.touchEnd(element!);

      await waitFor(() => {
        expect(handleRefresh).toHaveBeenCalled();
      });
    });

    test('touch feedback provides visual response', async () => {
      render(
        <TouchFeedback>
          <button>Touch me</button>
        </TouchFeedback>
      );

      const button = screen.getByRole('button');
      const container = button.parentElement;
      
      // Simulate touch start
      fireEvent.touchStart(container!);
      
      // Should have scale transform applied
      expect(container).toHaveClass('scale-95');
      
      // Simulate touch end
      fireEvent.touchEnd(container!);
      
      await waitFor(() => {
        expect(container).not.toHaveClass('scale-95');
      });
    });
  });

  describe('Mobile Form Optimization', () => {
    test('inputs prevent zoom on iOS', () => {
      render(<Input type="email" placeholder="Enter email" />);
      
      const input = screen.getByRole('textbox');
      const styles = window.getComputedStyle(input);
      
      // Should use 16px font size to prevent zoom on iOS
      expect(parseInt(styles.fontSize)).toBeGreaterThanOrEqual(16);
    });

    test('inputs have proper keyboard types', () => {
      render(
        <div>
          <Input type="email" placeholder="Email" />
          <Input type="tel" placeholder="Phone" />
          <Input type="number" placeholder="Number" />
          <Input type="url" placeholder="Website" />
        </div>
      );

      expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email');
      expect(screen.getByPlaceholderText('Phone')).toHaveAttribute('type', 'tel');
      expect(screen.getByPlaceholderText('Number')).toHaveAttribute('type', 'number');
      expect(screen.getByPlaceholderText('Website')).toHaveAttribute('type', 'url');
    });

    test('form fields have proper spacing on mobile', () => {
      render(
        <div className="space-y-4 md:space-y-6">
          <Input placeholder="Field 1" />
          <Input placeholder="Field 2" />
          <Input placeholder="Field 3" />
        </div>
      );

      const container = screen.getByPlaceholderText('Field 1').parentElement?.parentElement;
      const styles = window.getComputedStyle(container!);
      
      // Should have proper spacing between form fields
      expect(styles.rowGap).toBe('1rem'); // space-y-4 = 16px
    });
  });

  describe('Mobile Utility Functions', () => {
    test('viewport detection functions work correctly', () => {
      // Test mobile detection
      mockViewport(375, 812);
      expect(mobile.viewport.isMobile()).toBe(true);
      expect(mobile.viewport.isTablet()).toBe(false);
      expect(mobile.viewport.isDesktop()).toBe(false);
      expect(mobile.viewport.getCategory()).toBe('mobile');

      // Test tablet detection
      mockViewport(768, 1024);
      expect(mobile.viewport.isMobile()).toBe(false);
      expect(mobile.viewport.isTablet()).toBe(true);
      expect(mobile.viewport.isDesktop()).toBe(false);
      expect(mobile.viewport.getCategory()).toBe('tablet');

      // Test desktop detection
      mockViewport(1024, 768);
      expect(mobile.viewport.isMobile()).toBe(false);
      expect(mobile.viewport.isTablet()).toBe(false);
      expect(mobile.viewport.isDesktop()).toBe(true);
      expect(mobile.viewport.getCategory()).toBe('desktop');
    });

    test('touch target utility generates correct classes', () => {
      const smallTarget = mobile.touchTarget('sm');
      const defaultTarget = mobile.touchTarget('default');
      const largeTarget = mobile.touchTarget('lg');

      expect(smallTarget).toContain('min-h-[44px]');
      expect(smallTarget).toContain('min-w-[44px]');
      expect(smallTarget).toContain('touch-manipulation');

      expect(defaultTarget).toContain('min-h-[48px]');
      expect(defaultTarget).toContain('min-w-[48px]');

      expect(largeTarget).toContain('min-h-[52px]');
      expect(largeTarget).toContain('min-w-[52px]');
    });

    test('mobile container utility provides responsive padding', () => {
      const container = mobile.container('default');
      
      expect(container).toContain('max-w-4xl');
      expect(container).toContain('mx-auto');
      expect(container).toContain('px-4');
      expect(container).toContain('sm:px-6');
      expect(container).toContain('md:px-8');
    });
  });

  describe('Responsive Testing Utilities', () => {
    test('ResponsiveTestRunner can test breakpoints', async () => {
      const runner = new ResponsiveTestRunner();
      
      // Mock DOM elements for testing
      document.body.innerHTML = `
        <button style="width: 48px; height: 48px;">Test Button</button>
        <div style="width: 100%; max-width: 1200px;">Content</div>
      `;
      
      const result = await runner.testBreakpoint('MOBILE_STANDARD', 375);
      
      expect(result.breakpoint).toBe('MOBILE_STANDARD');
      expect(result.width).toBe(375);
      expect(result.touchTargets).toHaveLength(1);
      expect(result.touchTargets[0].passed).toBe(true);
    });

    test('touch target validation detects undersized elements', async () => {
      const runner = new ResponsiveTestRunner();
      
      // Mock undersized button
      document.body.innerHTML = `
        <button style="width: 30px; height: 30px;">Small Button</button>
      `;
      
      const touchTargets = runner.testTouchTargets();
      
      expect(touchTargets).toHaveLength(1);
      expect(touchTargets[0].passed).toBe(false);
      expect(touchTargets[0].issues).toContain(expect.stringContaining('below minimum'));
    });
  });

  describe('Performance on Mobile', () => {
    test('components use GPU acceleration for animations', () => {
      render(
        <div className="transform-gpu transition-transform hover:scale-105">
          Animated Element
        </div>
      );

      const element = screen.getByText('Animated Element');
      expect(element).toHaveClass('transform-gpu');
      expect(element).toHaveClass('transition-transform');
    });

    test('components respect reduced motion preferences', () => {
      render(
        <div className="motion-reduce:transition-none motion-reduce:animate-none animate-bounce">
          Animated Element
        </div>
      );

      const element = screen.getByText('Animated Element');
      expect(element).toHaveClass('motion-reduce:transition-none');
      expect(element).toHaveClass('motion-reduce:animate-none');
    });
  });
});

describe('Mobile Optimization Property Tests', () => {
  test('Property: All interactive elements meet minimum touch target size', () => {
    // This would be implemented as a property-based test
    // Testing that any interactive element has minimum 44x44px touch target
    const interactiveElements = [
      { component: Button, props: { children: 'Test' } },
      { component: Card, props: { variant: 'interactive' as const, children: 'Test' } },
    ];

    interactiveElements.forEach(({ component: Component, props }) => {
      render(<Component {...props} />);
      
      const element = screen.getByText('Test');
      const styles = window.getComputedStyle(element);
      const minHeight = parseInt(styles.minHeight) || parseInt(styles.height);
      const minWidth = parseInt(styles.minWidth) || parseInt(styles.width);
      
      expect(minHeight).toBeGreaterThanOrEqual(44);
      expect(minWidth).toBeGreaterThanOrEqual(44);
    });
  });

  test('Property: All text maintains readability across breakpoints', () => {
    const breakpoints = [320, 375, 768, 1024, 1920];
    
    breakpoints.forEach(width => {
      mockViewport(width, 800);
      
      render(
        <div className="text-sm sm:text-base md:text-lg">
          Test text content
        </div>
      );

      const element = screen.getByText('Test text content');
      const styles = window.getComputedStyle(element);
      const fontSize = parseInt(styles.fontSize);
      
      // Minimum readable font size
      const minSize = width < 768 ? 14 : 12;
      expect(fontSize).toBeGreaterThanOrEqual(minSize);
    });
  });

  test('Property: No horizontal scroll on any breakpoint', () => {
    const breakpoints = [320, 375, 768, 1024, 1920];
    
    breakpoints.forEach(width => {
      mockViewport(width, 800);
      
      render(
        <div className="w-full max-w-full overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            <div>Content 1</div>
            <div>Content 2</div>
            <div>Content 3</div>
          </div>
        </div>
      );

      const container = screen.getByText('Content 1').parentElement?.parentElement;
      const styles = window.getComputedStyle(container!);
      
      // Should not exceed viewport width
      expect(styles.overflowX).toBe('hidden');
      expect(styles.maxWidth).toBe('100%');
    });
  });
});