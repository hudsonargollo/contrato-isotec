/**
 * Enhanced Card Component Tests
 * Tests for task 2.5: Create enhanced Card component
 * 
 * Requirements tested:
 * - 1.5: Enhanced visual elements with refined borders, backgrounds, and depth effects
 * - 11.6: Interactive elements with hover effects
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

describe('Enhanced Card Component', () => {
  describe('Base Card Styling', () => {
    it('should render with base styling including border and shadow', () => {
      render(
        <Card data-testid="card">
          <CardContent>Test content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass(
        'bg-white',
        'border',
        'border-neutral-200',
        'rounded-xl',
        'shadow-sm',
        'transition-all',
        'duration-200',
        'ease-out'
      );
    });

    it('should render with default variant when no variant specified', () => {
      render(
        <Card data-testid="card">
          <CardContent>Test content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      // Default variant should not have interactive classes
      expect(card).not.toHaveClass('cursor-pointer');
      expect(card).not.toHaveClass('hover:scale-[1.02]');
    });

    it('should apply custom className alongside base classes', () => {
      render(
        <Card data-testid="card" className="custom-class">
          <CardContent>Test content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('bg-white'); // Base class should still be present
    });
  });

  describe('Card Variants', () => {
    it('should render interactive variant with hover and scale effects', () => {
      render(
        <Card data-testid="card" variant="interactive">
          <CardContent>Interactive content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass(
        'cursor-pointer',
        'hover:shadow-md',
        'hover:border-neutral-300',
        'hover:scale-[1.02]',
        'hover:-translate-y-1',
        'active:scale-[0.98]',
        'active:translate-y-0'
      );
    });

    it('should render elevated variant with enhanced shadow', () => {
      render(
        <Card data-testid="card" variant="elevated">
          <CardContent>Elevated content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('shadow-md', 'border-neutral-300');
    });

    it('should render outlined variant with solar-themed border', () => {
      render(
        <Card data-testid="card" variant="outlined">
          <CardContent>Outlined content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass(
        'border-2',
        'border-solar-200',
        'shadow-none',
        'hover:border-solar-300',
        'hover:shadow-sm'
      );
    });
  });

  describe('Hover Effects', () => {
    it('should apply hover effects when hover prop is true', () => {
      render(
        <Card data-testid="card" hover>
          <CardContent>Hover content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('hover:shadow-md', 'hover:border-neutral-300');
    });

    it('should not apply hover effects when hover prop is false', () => {
      render(
        <Card data-testid="card" hover={false}>
          <CardContent>No hover content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      // Should have base classes but not hover-specific ones
      expect(card).toHaveClass('bg-white');
      expect(card).not.toHaveClass('hover:shadow-md');
    });
  });

  describe('Card Sub-components', () => {
    it('should render CardHeader with proper styling', () => {
      render(
        <Card>
          <CardHeader data-testid="header">
            <CardTitle>Test Title</CardTitle>
          </CardHeader>
        </Card>
      );
      
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    });

    it('should render CardTitle with enhanced typography', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle data-testid="title">Test Title</CardTitle>
          </CardHeader>
        </Card>
      );
      
      const title = screen.getByTestId('title');
      expect(title).toHaveClass(
        'text-2xl',
        'font-semibold',
        'leading-none',
        'tracking-tight',
        'text-neutral-900'
      );
      expect(title).toHaveTextContent('Test Title');
    });

    it('should render CardDescription with proper text styling', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription data-testid="description">
              Test description
            </CardDescription>
          </CardHeader>
        </Card>
      );
      
      const description = screen.getByTestId('description');
      expect(description).toHaveClass(
        'text-sm',
        'text-neutral-600',
        'leading-relaxed'
      );
      expect(description).toHaveTextContent('Test description');
    });

    it('should render CardContent with proper padding', () => {
      render(
        <Card>
          <CardContent data-testid="content">
            Test content
          </CardContent>
        </Card>
      );
      
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('p-6', 'pt-0');
      expect(content).toHaveTextContent('Test content');
    });

    it('should render CardFooter with flex layout', () => {
      render(
        <Card>
          <CardFooter data-testid="footer">
            Footer content
          </CardFooter>
        </Card>
      );
      
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
      expect(footer).toHaveTextContent('Footer content');
    });
  });

  describe('Accessibility and Semantic HTML', () => {
    it('should render as a div element by default', () => {
      render(
        <Card data-testid="card">
          <CardContent>Test content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card.tagName).toBe('DIV');
    });

    it('should pass through HTML attributes', () => {
      render(
        <Card data-testid="card" role="article" aria-label="Test card">
          <CardContent>Test content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('role', 'article');
      expect(card).toHaveAttribute('aria-label', 'Test card');
    });

    it('should render CardTitle as h3 element', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
          </CardHeader>
        </Card>
      );
      
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('Test Title');
    });
  });

  describe('Complete Card Structure', () => {
    it('should render a complete card with all sub-components', () => {
      render(
        <Card data-testid="complete-card" variant="interactive">
          <CardHeader>
            <CardTitle>Complete Card</CardTitle>
            <CardDescription>A card with all components</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the main content of the card.</p>
          </CardContent>
          <CardFooter>
            <button>Action Button</button>
          </CardFooter>
        </Card>
      );
      
      // Check that all components are rendered
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Complete Card');
      expect(screen.getByText('A card with all components')).toBeInTheDocument();
      expect(screen.getByText('This is the main content of the card.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
      
      // Check that the card has interactive styling
      const card = screen.getByTestId('complete-card');
      expect(card).toHaveClass('cursor-pointer', 'hover:scale-[1.02]');
    });
  });
});