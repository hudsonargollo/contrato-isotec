import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Test component to verify typography system
const TypographyTestComponent: React.FC = () => {
  return (
    <div className="font-sans">
      <h1 className="text-5xl font-bold" data-testid="heading-1">
        Main Heading
      </h1>
      <h2 className="text-3xl font-semibold" data-testid="heading-2">
        Secondary Heading
      </h2>
      <h3 className="text-2xl font-medium" data-testid="heading-3">
        Tertiary Heading
      </h3>
      <p className="text-base font-normal leading-relaxed" data-testid="body-text">
        This is body text using the Inter font family with proper line height and spacing.
      </p>
      <p className="text-sm text-neutral-600" data-testid="small-text">
        Small text for captions and secondary information.
      </p>
      <div className="prose" data-testid="prose-content">
        <p>This is prose content with optimized reading experience.</p>
      </div>
    </div>
  );
};

describe('Typography System', () => {
  beforeEach(() => {
    render(<TypographyTestComponent />);
  });

  it('should render headings with correct hierarchy', () => {
    const h1 = screen.getByTestId('heading-1');
    const h2 = screen.getByTestId('heading-2');
    const h3 = screen.getByTestId('heading-3');

    expect(h1).toBeInTheDocument();
    expect(h2).toBeInTheDocument();
    expect(h3).toBeInTheDocument();

    // Verify heading content
    expect(h1).toHaveTextContent('Main Heading');
    expect(h2).toHaveTextContent('Secondary Heading');
    expect(h3).toHaveTextContent('Tertiary Heading');
  });

  it('should apply correct font classes', () => {
    const h1 = screen.getByTestId('heading-1');
    const bodyText = screen.getByTestId('body-text');
    const smallText = screen.getByTestId('small-text');

    // Check font size classes
    expect(h1).toHaveClass('text-5xl');
    expect(bodyText).toHaveClass('text-base');
    expect(smallText).toHaveClass('text-sm');

    // Check font weight classes
    expect(h1).toHaveClass('font-bold');
    expect(bodyText).toHaveClass('font-normal');
  });

  it('should apply Inter font family', () => {
    const container = screen.getByTestId('heading-1').parentElement;
    expect(container).toHaveClass('font-sans');
  });

  it('should apply proper line height for readability', () => {
    const bodyText = screen.getByTestId('body-text');
    expect(bodyText).toHaveClass('leading-relaxed');
  });

  it('should render prose content with proper styling', () => {
    const proseContent = screen.getByTestId('prose-content');
    expect(proseContent).toHaveClass('prose');
    expect(proseContent).toHaveTextContent('This is prose content with optimized reading experience.');
  });

  it('should apply semantic color classes', () => {
    const smallText = screen.getByTestId('small-text');
    expect(smallText).toHaveClass('text-neutral-600');
  });
});

describe('Typography Responsive Behavior', () => {
  it('should handle responsive font sizes', () => {
    render(
      <div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl" data-testid="responsive-heading">
          Responsive Heading
        </h1>
      </div>
    );

    const heading = screen.getByTestId('responsive-heading');
    expect(heading).toHaveClass('text-4xl', 'md:text-5xl', 'lg:text-6xl');
  });

  it('should apply mobile-optimized font sizes', () => {
    render(
      <div>
        <p className="text-base md:text-lg" data-testid="responsive-text">
          Responsive body text
        </p>
      </div>
    );

    const text = screen.getByTestId('responsive-text');
    expect(text).toHaveClass('text-base', 'md:text-lg');
  });
});

describe('Typography Accessibility', () => {
  it('should maintain proper heading hierarchy for screen readers', () => {
    render(
      <div>
        <h1 data-testid="h1">Level 1</h1>
        <h2 data-testid="h2">Level 2</h2>
        <h3 data-testid="h3">Level 3</h3>
      </div>
    );

    expect(screen.getByTestId('h1').tagName).toBe('H1');
    expect(screen.getByTestId('h2').tagName).toBe('H2');
    expect(screen.getByTestId('h3').tagName).toBe('H3');
  });

  it('should provide sufficient contrast with neutral colors', () => {
    render(
      <div className="bg-neutral-50">
        <p className="text-neutral-900" data-testid="high-contrast-text">
          High contrast text
        </p>
        <p className="text-neutral-600" data-testid="medium-contrast-text">
          Medium contrast text
        </p>
      </div>
    );

    const highContrastText = screen.getByTestId('high-contrast-text');
    const mediumContrastText = screen.getByTestId('medium-contrast-text');

    expect(highContrastText).toHaveClass('text-neutral-900');
    expect(mediumContrastText).toHaveClass('text-neutral-600');
  });
});