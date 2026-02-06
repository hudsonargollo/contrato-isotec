/**
 * Responsive Breakpoints Tests
 * 
 * Tests all pages at required breakpoints: 320px, 375px, 768px, 1024px, 1920px
 * Validates: Requirements 3.1, 3.2, 3.3, 3.6
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import pages and components to test
import HomePage from '@/app/page';
import { ContractWizard } from '@/components/wizard/ContractWizard';
import { Hero } from '@/components/ui/hero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ResponsiveTestRunner, TEST_BREAKPOINTS } from '@/lib/utils/responsive-testing';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

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
  
  // Mock visual viewport for mobile testing
  Object.defineProperty(window, 'visualViewport', {
    writable: true,
    configurable: true,
    value: {
      width,
      height,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  });
  
  // Trigger resize event
  fireEvent(window, new Event('resize'));
};

// Helper to get computed styles
const getComputedStyleValue = (element: Element, property: string): string => {
  return window.getComputedStyle(element).getPropertyValue(property);
};

describe('Responsive Breakpoints Testing', () => {
  describe('320px - Small Mobile (iPhone SE)', () => {
    beforeEach(() => {
      mockViewport(320, 568);
    });

    test('landing page renders correctly at 320px', () => {
      render(<HomePage />);
      
      // Check that main content is visible
      expect(screen.getByText('Sistema de Contratos Fotovoltaicos')).toBeInTheDocument();
      expect(screen.getByText('Criar Novo Contrato')).toBeInTheDocument();
      
      // Check that content doesn't overflow
      const main = document.querySelector('main');
      if (main) {
        expect(main.scrollWidth).toBeLessThanOrEqual(320);
      }
    });

    test('buttons meet minimum touch targets at 320px', () => {
      render(
        <div>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </div>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        expect(rect.height).toBeGreaterThanOrEqual(44);
        expect(rect.width).toBeGreaterThanOrEqual(44);
      });
    });

    test('form inputs are properly sized at 320px', () => {
      render(
        <div>
          <Input placeholder="Test input" />
          <Input size="sm" placeholder="Small input" />
          <Input size="lg" placeholder="Large input" />
        </div>
      );

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => {
        const rect = input.getBoundingClientRect();
        expect(rect.height).toBeGreaterThanOrEqual(44);
        
        // Should not exceed viewport width
        expect(rect.width).toBeLessThanOrEqual(320);
      });
    });

    test('grid layouts collapse to single column at 320px', () => {
      render(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </div>
      );

      const container = screen.getByText('Item 1').parentElement;
      const styles = window.getComputedStyle(container!);
      
      // Should be single column on small mobile
      expect(styles.gridTemplateColumns).toBe('repeat(1, minmax(0, 1fr))');
    });

    test('text remains readable at 320px', () => {
      render(
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl">Heading</h1>
          <p className="text-sm sm:text-base">Body text</p>
        </div>
      );

      const heading = screen.getByText('Heading');
      const body = screen.getByText('Body text');
      
      const headingSize = parseInt(getComputedStyleValue(heading, 'font-size'));
      const bodySize = parseInt(getComputedStyleValue(body, 'font-size'));
      
      // Minimum readable sizes
      expect(headingSize).toBeGreaterThanOrEqual(24); // text-2xl
      expect(bodySize).toBeGreaterThanOrEqual(14); // text-sm
    });
  });

  describe('375px - Standard Mobile (iPhone)', () => {
    beforeEach(() => {
      mockViewport(375, 812);
    });

    test('landing page renders correctly at 375px', () => {
      render(<HomePage />);
      
      // Check responsive features grid
      const features = screen.getByLabelText('Principais funcionalidades do sistema');
      expect(features).toBeInTheDocument();
      
      // Should still be single column on mobile
      const styles = window.getComputedStyle(features);
      expect(styles.gridTemplateColumns).toBe('repeat(1, minmax(0, 1fr))');
    });

    test('hero component scales properly at 375px', () => {
      render(
        <Hero>
          <div className="text-4xl md:text-5xl lg:text-6xl">Hero Title</div>
        </Hero>
      );

      const title = screen.getByText('Hero Title');
      const fontSize = parseInt(getComputedStyleValue(title, 'font-size'));
      
      // Should use text-4xl (36px) on mobile
      expect(fontSize).toBe(36);
    });

    test('cards maintain proper spacing at 375px', () => {
      render(
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>Card 1</Card>
          <Card>Card 2</Card>
        </div>
      );

      const container = screen.getByText('Card 1').parentElement?.parentElement;
      const styles = window.getComputedStyle(container!);
      
      // Should still be single column
      expect(styles.gridTemplateColumns).toBe('repeat(1, minmax(0, 1fr))');
      expect(styles.gap).toBe('1rem'); // gap-4
    });

    test('navigation buttons are touch-friendly at 375px', () => {
      render(
        <div className="flex gap-2">
          <Button>Previous</Button>
          <Button>Next</Button>
        </div>
      );

      const buttons = screen.getAllByRole('button');
      const container = buttons[0].parentElement;
      
      // Check spacing between buttons
      const styles = window.getComputedStyle(container!);
      expect(parseInt(styles.gap)).toBeGreaterThanOrEqual(8); // gap-2 = 8px
      
      // Check button sizes
      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        expect(rect.height).toBeGreaterThanOrEqual(48); // Recommended touch target
      });
    });
  });

  describe('768px - Tablet', () => {
    beforeEach(() => {
      mockViewport(768, 1024);
    });

    test('landing page uses 2-column layout at 768px', () => {
      render(<HomePage />);
      
      // Features should now use md:grid-cols-3, but at 768px it should be 3 columns
      const features = screen.getByLabelText('Principais funcionalidades do sistema');
      const styles = window.getComputedStyle(features);
      
      expect(styles.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
    });

    test('form layouts optimize for tablet at 768px', () => {
      render(
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input placeholder="Field 1" />
          <Input placeholder="Field 2" />
        </div>
      );

      const container = screen.getByPlaceholderText('Field 1').parentElement?.parentElement;
      const styles = window.getComputedStyle(container!);
      
      // Should be 2 columns on tablet
      expect(styles.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
      expect(styles.gap).toBe('1.5rem'); // gap-6
    });

    test('text sizes increase appropriately at 768px', () => {
      render(
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl">Heading</h1>
          <p className="text-sm sm:text-base md:text-lg">Body text</p>
        </div>
      );

      const heading = screen.getByText('Heading');
      const body = screen.getByText('Body text');
      
      const headingSize = parseInt(getComputedStyleValue(heading, 'font-size'));
      const bodySize = parseInt(getComputedStyleValue(body, 'font-size'));
      
      // Should use md: sizes
      expect(headingSize).toBe(36); // text-4xl
      expect(bodySize).toBe(18); // text-lg
    });

    test('container padding adjusts for tablet at 768px', () => {
      render(
        <div className="px-4 sm:px-6 md:px-8">
          <div>Content</div>
        </div>
      );

      const container = screen.getByText('Content').parentElement;
      const styles = window.getComputedStyle(container!);
      
      // Should use md:px-8 (32px)
      expect(parseInt(styles.paddingLeft)).toBe(32);
      expect(parseInt(styles.paddingRight)).toBe(32);
    });
  });

  describe('1024px - Desktop', () => {
    beforeEach(() => {
      mockViewport(1024, 768);
    });

    test('landing page uses full desktop layout at 1024px', () => {
      render(<HomePage />);
      
      // Features should use 3 columns
      const features = screen.getByLabelText('Principais funcionalidades do sistema');
      const styles = window.getComputedStyle(features);
      
      expect(styles.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
    });

    test('hero text uses large sizes at 1024px', () => {
      render(
        <div className="text-4xl md:text-5xl lg:text-6xl">
          Desktop Hero
        </div>
      );

      const hero = screen.getByText('Desktop Hero');
      const fontSize = parseInt(getComputedStyleValue(hero, 'font-size'));
      
      // Should use lg:text-6xl (60px)
      expect(fontSize).toBe(60);
    });

    test('complex layouts work properly at 1024px', () => {
      render(
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
          <div>Item 4</div>
        </div>
      );

      const container = screen.getByText('Item 1').parentElement;
      const styles = window.getComputedStyle(container!);
      
      // Should use lg:grid-cols-3
      expect(styles.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
    });

    test('mascot becomes visible at desktop size', () => {
      render(
        <div className="hidden lg:block">
          <img src="/mascote.webp" alt="Mascot" />
        </div>
      );

      const mascot = screen.getByAltText('Mascot');
      const styles = window.getComputedStyle(mascot.parentElement!);
      
      // Should be visible (not display: none)
      expect(styles.display).not.toBe('none');
    });
  });

  describe('1920px - Large Desktop', () => {
    beforeEach(() => {
      mockViewport(1920, 1080);
    });

    test('content maintains max-width constraints at 1920px', () => {
      render(
        <div className="max-w-7xl mx-auto">
          <div>Large desktop content</div>
        </div>
      );

      const container = screen.getByText('Large desktop content').parentElement;
      const styles = window.getComputedStyle(container!);
      
      // Should have max-width constraint
      expect(styles.maxWidth).toBe('80rem'); // max-w-7xl
      expect(styles.marginLeft).toBe('auto');
      expect(styles.marginRight).toBe('auto');
    });

    test('grid layouts use maximum columns at 1920px', () => {
      render(
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
          <div>Item 4</div>
        </div>
      );

      const container = screen.getByText('Item 1').parentElement;
      const styles = window.getComputedStyle(container!);
      
      // Should use xl:grid-cols-4
      expect(styles.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
      expect(styles.gap).toBe('2rem'); // gap-8
    });

    test('text maintains readability at large sizes', () => {
      render(
        <div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            Large Heading
          </h1>
          <p className="text-base md:text-lg xl:text-xl max-w-4xl">
            This is body text that should remain readable even on very large screens.
          </p>
        </div>
      );

      const heading = screen.getByText('Large Heading');
      const body = screen.getByText(/This is body text/);
      
      const headingSize = parseInt(getComputedStyleValue(heading, 'font-size'));
      const bodySize = parseInt(getComputedStyleValue(body, 'font-size'));
      
      // Should use xl: sizes
      expect(headingSize).toBe(72); // text-7xl
      expect(bodySize).toBe(20); // text-xl
      
      // Body text should have max-width for readability
      const bodyStyles = window.getComputedStyle(body);
      expect(bodyStyles.maxWidth).toBe('56rem'); // max-w-4xl
    });
  });

  describe('Cross-Breakpoint Consistency', () => {
    test('touch targets remain consistent across all breakpoints', () => {
      const breakpoints = [320, 375, 768, 1024, 1920];
      
      breakpoints.forEach((width) => {
        mockViewport(width, 800);
        
        const { rerender } = render(<Button>Test Button</Button>);
        
        const button = screen.getByRole('button');
        const rect = button.getBoundingClientRect();
        
        // Touch targets should always meet minimum requirements
        expect(rect.height).toBeGreaterThanOrEqual(48);
        expect(rect.width).toBeGreaterThanOrEqual(48);
        
        rerender(<div />); // Clean up for next iteration
      });
    });

    test('no horizontal scroll at any breakpoint', () => {
      const breakpoints = [320, 375, 768, 1024, 1920];
      
      breakpoints.forEach((width) => {
        mockViewport(width, 800);
        
        render(
          <div className="w-full max-w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              <div>Content that should not overflow</div>
              <div>More content</div>
              <div>Even more content</div>
            </div>
          </div>
        );

        const container = screen.getByText('Content that should not overflow').parentElement?.parentElement?.parentElement;
        
        if (container) {
          expect(container.scrollWidth).toBeLessThanOrEqual(width);
        }
      });
    });

    test('spacing scales appropriately across breakpoints', () => {
      const breakpoints = [
        { width: 320, expectedGap: '1rem' }, // gap-4
        { width: 768, expectedGap: '1.5rem' }, // md:gap-6
        { width: 1024, expectedGap: '2rem' }, // lg:gap-8
      ];
      
      breakpoints.forEach(({ width, expectedGap }) => {
        mockViewport(width, 800);
        
        render(
          <div className="flex gap-4 md:gap-6 lg:gap-8">
            <div>Item 1</div>
            <div>Item 2</div>
          </div>
        );

        const container = screen.getByText('Item 1').parentElement;
        const styles = window.getComputedStyle(container!);
        
        expect(styles.gap).toBe(expectedGap);
      });
    });
  });

  describe('Responsive Test Runner Integration', () => {
    test('ResponsiveTestRunner detects layout issues', async () => {
      const runner = new ResponsiveTestRunner();
      
      // Create a problematic layout
      document.body.innerHTML = `
        <div style="width: 400px; height: 100px;">
          <button style="width: 30px; height: 30px;">Too Small</button>
          <div style="width: 500px;">Overflowing content</div>
        </div>
      `;
      
      const result = await runner.testBreakpoint('MOBILE_STANDARD', 375);
      
      expect(result.passed).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.touchTargets.some(t => !t.passed)).toBe(true);
    });

    test('ResponsiveTestRunner validates all required breakpoints', async () => {
      const runner = new ResponsiveTestRunner();
      const results = await runner.testAllBreakpoints();
      
      expect(results).toHaveLength(5); // All 5 required breakpoints
      
      const breakpointNames = results.map(r => r.breakpoint);
      expect(breakpointNames).toContain('MOBILE_SMALL');
      expect(breakpointNames).toContain('MOBILE_STANDARD');
      expect(breakpointNames).toContain('TABLET');
      expect(breakpointNames).toContain('DESKTOP');
      expect(breakpointNames).toContain('DESKTOP_LARGE');
    });
  });
});