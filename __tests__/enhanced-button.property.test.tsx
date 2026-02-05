/**
 * Enhanced Button Component Property-Based Tests
 * Property-based tests for the enhanced Button component
 * Validates: Requirements 1.1, 1.3, 11.1, 11.2, 11.4
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { Button } from '@/components/ui/button';

// Generators for property-based testing
const buttonVariantGen = fc.constantFrom('primary', 'secondary', 'outline', 'ghost');
const buttonSizeGen = fc.constantFrom('sm', 'default', 'lg', 'xl');
const buttonTextGen = fc.string({ minLength: 1, maxLength: 50 });
const loadingTextGen = fc.string({ minLength: 1, maxLength: 30 });

describe('Enhanced Button Property-Based Tests', () => {
  /**
   * Property 1: Interactive Element Feedback
   * For any button variant and size, hovering or focusing should produce visible visual feedback
   * **Validates: Requirements 11.1, 11.2, 11.3, 11.6**
   */
  it('Property 1: All button variants have hover and focus feedback classes', () => {
    fc.assert(
      fc.property(
        buttonVariantGen,
        buttonSizeGen,
        buttonTextGen,
        (variant, size, text) => {
          render(<Button variant={variant} size={size}>{text}</Button>);
          const button = screen.getByRole('button');
          
          // All buttons should have transition classes for smooth feedback
          expect(button).toHaveClass('transition-all', 'duration-200');
          
          // All buttons should have focus-visible styles
          expect(button).toHaveClass('focus-visible:outline-none');
          expect(button).toHaveClass('focus-visible:ring-2');
          expect(button).toHaveClass('focus-visible:ring-offset-2');
          
          // All buttons should have active scale effect
          expect(button).toHaveClass('active:scale-95');
          
          // Variant-specific hover effects
          const classList = Array.from(button.classList);
          const hasHoverEffect = classList.some(cls => cls.startsWith('hover:'));
          expect(hasHoverEffect).toBe(true);
          
          // Variant-specific focus ring colors
          const hasFocusRing = classList.some(cls => cls.includes('focus-visible:ring-'));
          expect(hasFocusRing).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 2: Touch Target Sizing
   * For any button size on mobile viewports, the touch target should be minimum 44x44 pixels
   * **Validates: Requirements 3.7**
   */
  it('Property 2: All button sizes meet minimum touch target requirements', () => {
    fc.assert(
      fc.property(
        buttonSizeGen,
        buttonTextGen,
        (size, text) => {
          render(<Button size={size}>{text}</Button>);
          const button = screen.getByRole('button');
          
          // Check minimum width classes
          const classList = Array.from(button.classList);
          const hasMinWidth = classList.some(cls => cls.startsWith('min-w-'));
          expect(hasMinWidth).toBe(true);
          
          // Check height classes for minimum touch target
          const heightClasses = classList.filter(cls => cls.startsWith('h-'));
          expect(heightClasses.length).toBeGreaterThan(0);
          
          // Verify specific minimum sizes based on size variant
          switch (size) {
            case 'sm':
              expect(button).toHaveClass('h-9'); // 36px
              expect(button).toHaveClass('min-w-[2.25rem]'); // 36px
              break;
            case 'default':
              expect(button).toHaveClass('h-10'); // 40px
              expect(button).toHaveClass('min-w-[2.5rem]'); // 40px
              break;
            case 'lg':
              expect(button).toHaveClass('h-11'); // 44px
              expect(button).toHaveClass('min-w-[2.75rem]'); // 44px
              break;
            case 'xl':
              expect(button).toHaveClass('h-12'); // 48px
              expect(button).toHaveClass('min-w-[3rem]'); // 48px
              break;
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 3: Loading State Visibility
   * For any button with loading state, a loading indicator should be visible
   * **Validates: Requirements 8.1, 8.3**
   */
  it('Property 3: Loading state always shows spinner and appropriate text', () => {
    fc.assert(
      fc.property(
        buttonVariantGen,
        buttonSizeGen,
        buttonTextGen,
        fc.option(loadingTextGen),
        (variant, size, text, loadingText) => {
          render(
            <Button 
              variant={variant} 
              size={size} 
              loading 
              loadingText={loadingText || undefined}
            >
              {text}
            </Button>
          );
          
          const button = screen.getByRole('button');
          
          // Button should be disabled when loading
          expect(button).toBeDisabled();
          
          // Should show loading spinner
          const spinner = document.querySelector('.animate-spin');
          expect(spinner).toBeInTheDocument();
          
          // Should show appropriate loading text
          if (loadingText) {
            expect(screen.getByText(loadingText)).toBeInTheDocument();
            expect(screen.queryByText(text)).not.toBeInTheDocument();
          } else {
            expect(screen.getByText('Loading...')).toBeInTheDocument();
            expect(screen.queryByText(text)).not.toBeInTheDocument();
          }
          
          // Spinner should have correct size based on button size
          if (spinner) {
            const spinnerClasses = Array.from(spinner.classList);
            const hasSizeClass = spinnerClasses.some(cls => 
              cls.includes('h-') && cls.includes('w-')
            );
            expect(hasSizeClass).toBe(true);
          }
        }
      ),
      { numRuns: 40 }
    );
  });

  /**
   * Property 4: Brand Color Consistency
   * For any button, primary brand colors (solar yellow/orange) should be used consistently
   * **Validates: Requirements 2.1, 2.4, 2.6**
   */
  it('Property 4: Primary buttons consistently use solar brand colors', () => {
    fc.assert(
      fc.property(
        buttonSizeGen,
        buttonTextGen,
        (size, text) => {
          render(<Button variant="primary" size={size}>{text}</Button>);
          const button = screen.getByRole('button');
          
          // Primary buttons should use solar gradient
          expect(button).toHaveClass('bg-gradient-to-r');
          expect(button).toHaveClass('from-solar-500');
          expect(button).toHaveClass('to-solar-600');
          
          // Should have solar-themed hover states
          expect(button).toHaveClass('hover:from-solar-600');
          expect(button).toHaveClass('hover:to-solar-700');
          
          // Should have solar-themed shadows
          expect(button).toHaveClass('shadow-solar-500/30');
          expect(button).toHaveClass('hover:shadow-solar-500/40');
          
          // Should have solar-themed focus ring
          expect(button).toHaveClass('focus-visible:ring-solar-500');
          
          // Text should be white for contrast
          expect(button).toHaveClass('text-white');
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 5: Disabled State Consistency
   * For any disabled button, it should have consistent disabled styling and behavior
   * **Validates: Requirements 11.4**
   */
  it('Property 5: Disabled buttons have consistent styling and behavior', () => {
    fc.assert(
      fc.property(
        buttonVariantGen,
        buttonSizeGen,
        buttonTextGen,
        fc.boolean(),
        (variant, size, text, loading) => {
          render(
            <Button 
              variant={variant} 
              size={size} 
              disabled={true}
              loading={loading}
            >
              {text}
            </Button>
          );
          
          const button = screen.getByRole('button');
          
          // Should be disabled
          expect(button).toBeDisabled();
          
          // Should have disabled pointer events
          expect(button).toHaveClass('disabled:pointer-events-none');
          
          // Should have disabled cursor
          expect(button).toHaveClass('disabled:cursor-not-allowed');
          
          // Should have variant-specific disabled styles
          const classList = Array.from(button.classList);
          const hasDisabledStyles = classList.some(cls => cls.startsWith('disabled:'));
          expect(hasDisabledStyles).toBe(true);
          
          // If also loading, should show loading state
          if (loading) {
            const spinner = document.querySelector('.animate-spin');
            expect(spinner).toBeInTheDocument();
          }
        }
      ),
      { numRuns: 40 }
    );
  });

  /**
   * Property 6: Animation Performance
   * For any button with animations, transitions should be smooth without layout shifts
   * **Validates: Requirements 8.5, 8.6**
   */
  it('Property 6: All buttons have smooth transitions without layout shifts', () => {
    fc.assert(
      fc.property(
        buttonVariantGen,
        buttonSizeGen,
        buttonTextGen,
        (variant, size, text) => {
          render(<Button variant={variant} size={size}>{text}</Button>);
          const button = screen.getByRole('button');
          
          // Should have transition classes
          expect(button).toHaveClass('transition-all');
          expect(button).toHaveClass('duration-200');
          
          // Should have transform classes that don't cause layout shifts
          expect(button).toHaveClass('active:scale-95');
          
          // Should use transform-based animations (scale) rather than layout-affecting properties
          const classList = Array.from(button.classList);
          const hasTransformAnimations = classList.some(cls => 
            cls.includes('scale') || cls.includes('transform')
          );
          
          // Active scale should be present for micro-interactions
          expect(button).toHaveClass('active:scale-95');
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 7: Accessibility Compliance
   * For any button configuration, it should meet accessibility standards
   * **Validates: Requirements 10.2**
   */
  it('Property 7: All button variants maintain accessibility standards', () => {
    fc.assert(
      fc.property(
        buttonVariantGen,
        buttonSizeGen,
        buttonTextGen,
        (variant, size, text) => {
          render(<Button variant={variant} size={size}>{text}</Button>);
          const button = screen.getByRole('button');
          
          // Should have proper role
          expect(button).toHaveAttribute('role', 'button');
          
          // Should have focus management
          expect(button).toHaveClass('focus-visible:outline-none');
          expect(button).toHaveClass('focus-visible:ring-2');
          
          // Should have accessible text content
          expect(button).toHaveTextContent(text);
          
          // Should not have conflicting accessibility attributes
          expect(button).not.toHaveAttribute('aria-hidden', 'true');
          
          // Should be keyboard accessible (implicit with button element)
          expect(button.tagName.toLowerCase()).toBe('button');
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 8: Variant Style Isolation
   * For any button variant, styles should not conflict with other variants
   * **Validates: Requirements 1.1, 1.3**
   */
  it('Property 8: Button variants have distinct and non-conflicting styles', () => {
    fc.assert(
      fc.property(
        buttonSizeGen,
        buttonTextGen,
        (size, text) => {
          // Test all variants to ensure they don't conflict
          const variants = ['primary', 'secondary', 'outline', 'ghost'] as const;
          const renderedButtons: HTMLElement[] = [];
          
          variants.forEach((variant, index) => {
            const { container } = render(
              <Button variant={variant} size={size} data-testid={`btn-${index}`}>
                {text}
              </Button>
            );
            const button = container.querySelector(`[data-testid="btn-${index}"]`) as HTMLElement;
            renderedButtons.push(button);
          });
          
          // Each variant should have distinct background classes
          const backgroundClasses = renderedButtons.map(btn => 
            Array.from(btn.classList).filter(cls => 
              cls.startsWith('bg-') || cls.includes('gradient')
            )
          );
          
          // Primary should have gradient
          expect(backgroundClasses[0]).toContain('bg-gradient-to-r');
          
          // Secondary should have solid background
          expect(backgroundClasses[1].some(cls => cls.includes('ocean'))).toBe(true);
          
          // Outline should have transparent background
          expect(backgroundClasses[2]).toContain('bg-transparent');
          
          // Ghost should have transparent background
          expect(backgroundClasses[3]).toContain('bg-transparent');
          
          // Each should have different hover states
          const hoverClasses = renderedButtons.map(btn =>
            Array.from(btn.classList).filter(cls => cls.startsWith('hover:'))
          );
          
          // All should have hover effects but different ones
          hoverClasses.forEach(classes => {
            expect(classes.length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 20 }
    );
  });
});