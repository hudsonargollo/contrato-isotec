/**
 * Enhanced Button Component Tests
 * Tests for the enhanced Button component with all variants and states
 * Validates: Requirements 1.1, 1.3, 11.1, 11.2, 11.4
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Enhanced Button Component', () => {
  // Basic rendering tests
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-gradient-to-r', 'from-solar-500', 'to-solar-600');
    });

    it('renders children correctly', () => {
      render(<Button>Test Button</Button>);
      expect(screen.getByText('Test Button')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  // Variant tests
  describe('Button Variants', () => {
    it('renders primary variant with solar gradient', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-r', 'from-solar-500', 'to-solar-600');
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('shadow-lg', 'shadow-solar-500/30');
    });

    it('renders secondary variant with ocean colors', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-ocean-500');
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('shadow-md', 'shadow-ocean-500/20');
    });

    it('renders outline variant with solar border', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-2', 'border-solar-500');
      expect(button).toHaveClass('text-solar-600');
      expect(button).toHaveClass('bg-transparent');
    });

    it('renders ghost variant with minimal styling', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-neutral-700');
      expect(button).toHaveClass('bg-transparent');
    });
  });

  // Size tests
  describe('Button Sizes', () => {
    it('renders small size correctly', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9', 'px-3', 'text-sm');
    });

    it('renders default size correctly', () => {
      render(<Button size="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'px-4', 'py-2', 'text-base');
    });

    it('renders large size correctly', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'px-6', 'text-lg');
    });

    it('renders extra large size correctly', () => {
      render(<Button size="xl">Extra Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12', 'px-8', 'text-xl');
    });
  });

  // Loading state tests
  describe('Loading States', () => {
    it('shows loading spinner when loading is true', () => {
      render(<Button loading>Loading Button</Button>);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('shows default loading text when loading', () => {
      render(<Button loading>Click me</Button>);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Click me')).not.toBeInTheDocument();
    });

    it('shows custom loading text when provided', () => {
      render(<Button loading loadingText="Processing...">Click me</Button>);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.queryByText('Click me')).not.toBeInTheDocument();
    });

    it('disables button when loading', () => {
      render(<Button loading>Loading Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('shows correct spinner size for different button sizes', () => {
      const { rerender } = render(<Button size="sm" loading>Small</Button>);
      let spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('h-3', 'w-3');

      rerender(<Button size="lg" loading>Large</Button>);
      spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('h-5', 'w-5');

      rerender(<Button size="xl" loading>Extra Large</Button>);
      spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('h-6', 'w-6');
    });
  });

  // Disabled state tests
  describe('Disabled States', () => {
    it('applies disabled styles when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none');
    });

    it('applies disabled styles for different variants', () => {
      const { rerender } = render(<Button variant="primary" disabled>Primary</Button>);
      let button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:from-neutral-300', 'disabled:to-neutral-400');

      rerender(<Button variant="secondary" disabled>Secondary</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:bg-neutral-300');

      rerender(<Button variant="outline" disabled>Outline</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:border-neutral-300');
    });

    it('is disabled when loading is true', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  // Interaction tests
  describe('User Interactions', () => {
    it('calls onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} loading>Loading</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('applies active scale transform on click', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('active:scale-95');
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('has proper focus styles', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:outline-none');
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-offset-2');
    });

    it('has proper focus ring colors for different variants', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      let button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-solar-500');

      rerender(<Button variant="secondary">Secondary</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-ocean-500');

      rerender(<Button variant="outline">Outline</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-solar-500');

      rerender(<Button variant="ghost">Ghost</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-neutral-500');
    });

    it('maintains minimum touch target size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-w-[2.25rem]'); // 36px minimum
      expect(button).toHaveClass('h-9'); // 36px height
    });

    it('supports keyboard navigation', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      fireEvent.keyUp(button, { key: 'Enter', code: 'Enter' });
      
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      fireEvent.keyUp(button, { key: ' ', code: 'Space' });
      
      // Note: React Testing Library doesn't automatically trigger click events for keyboard events
      // This test verifies the button can receive focus and keyboard events
      expect(button).toHaveFocus();
    });
  });

  // Animation and transition tests
  describe('Animations and Transitions', () => {
    it('has smooth transitions', () => {
      render(<Button>Animated</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all', 'duration-200');
    });

    it('has hover effects for different variants', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      let button = screen.getByRole('button');
      expect(button).toHaveClass('hover:from-solar-600', 'hover:to-solar-700');
      expect(button).toHaveClass('hover:shadow-xl');

      rerender(<Button variant="secondary">Secondary</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-ocean-600');

      rerender(<Button variant="outline">Outline</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-solar-50');

      rerender(<Button variant="ghost">Ghost</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-neutral-100');
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('handles empty children', () => {
      render(<Button></Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('handles complex children elements', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('forwards HTML button attributes', () => {
      render(<Button type="submit" data-testid="submit-btn">Submit</Button>);
      const button = screen.getByTestId('submit-btn');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('handles both disabled and loading states', () => {
      render(<Button disabled loading>Both States</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
});