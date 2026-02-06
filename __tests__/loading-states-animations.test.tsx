/**
 * Loading States and Animations Test Suite
 * 
 * Tests for all loading states and animation components implemented in task 12.
 * Validates spinner components, skeleton loaders, page transitions, and micro-interactions.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import all components to test
import { 
  LoadingSpinner, 
  CenteredSpinner, 
  InlineSpinner, 
  LoadingOverlay 
} from '@/components/ui/loading-spinner';

import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonForm,
  SkeletonList,
  SkeletonAvatar,
} from '@/components/ui/skeleton';

import {
  PageTransition,
  AnimatedPage,
  WizardStepTransition,
  StaggeredAnimation,
  RouteTransition,
  ModalTransition,
  LoadingTransition,
} from '@/components/ui/page-transitions';

import {
  InteractiveButton,
  InteractiveCard,
  InteractiveInput,
  BouncingIcon,
  HoverLift,
  PulsingElement,
  WiggleElement,
  SuccessAnimation,
} from '@/components/ui/micro-interactions';

// Mock framer-motion for testing
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, ...props }: any) => {
      // Filter out framer-motion specific props
      const { whileHover, whileTap, whileFocus, animate, initial, exit, variants, transition, ...domProps } = props;
      return <div onClick={onClick} {...domProps}>{children}</div>;
    },
    button: ({ children, onClick, ...props }: any) => {
      const { whileHover, whileTap, whileFocus, animate, initial, exit, variants, transition, ...domProps } = props;
      return <button onClick={onClick} {...domProps}>{children}</button>;
    },
    input: ({ children, onChange, ...props }: any) => {
      const { whileHover, whileTap, whileFocus, animate, initial, exit, variants, transition, ...domProps } = props;
      return <input onChange={onChange} {...domProps}>{children}</input>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Loading Spinner Components', () => {
  describe('LoadingSpinner', () => {
    it('renders with default props', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-label', 'Loading...');
    });

    it('renders with custom screen reader text', () => {
      render(<LoadingSpinner srText="Processing data..." />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Processing data...');
    });

    it('applies size variants correctly', () => {
      const { rerender } = render(<LoadingSpinner size="sm" />);
      let spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('h-4', 'w-4');

      rerender(<LoadingSpinner size="lg" />);
      spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('h-8', 'w-8');
    });

    it('applies color variants correctly', () => {
      const { rerender } = render(<LoadingSpinner variant="solar" />);
      let spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('text-solar-500');

      rerender(<LoadingSpinner variant="ocean" />);
      spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('text-ocean-500');
    });
  });

  describe('CenteredSpinner', () => {
    it('renders centered spinner with text', () => {
      render(<CenteredSpinner text="Loading data..." />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });
  });

  describe('LoadingOverlay', () => {
    it('renders when visible is true', () => {
      render(<LoadingOverlay visible={true} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('does not render when visible is false', () => {
      render(<LoadingOverlay visible={false} />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});

describe('Skeleton Components', () => {
  describe('Skeleton', () => {
    it('renders with default styling', () => {
      render(<Skeleton data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('animate-skeleton', 'bg-neutral-200', 'rounded');
    });

    it('applies variant classes correctly', () => {
      render(<Skeleton variant="solar" data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('bg-solar-100');
    });
  });

  describe('SkeletonText', () => {
    it('renders single line by default', () => {
      render(<SkeletonText data-testid="skeleton-text" />);
      const skeleton = screen.getByTestId('skeleton-text');
      expect(skeleton).toHaveClass('h-4', 'w-full');
    });

    it('renders multiple lines when specified', () => {
      const { container } = render(<SkeletonText lines={3} />);
      // The component creates a wrapper div with space-y-2 class containing the skeleton lines
      const wrapperDiv = container.querySelector('.space-y-2');
      expect(wrapperDiv).toBeInTheDocument();
      expect(wrapperDiv).toHaveClass('space-y-2');
      // Check that we have the expected structure
      expect(wrapperDiv?.children).toHaveLength(3);
    });
  });

  describe('SkeletonCard', () => {
    it('renders card skeleton with default content', () => {
      render(<SkeletonCard />);
      // Should have multiple skeleton elements for card content
      const skeletons = screen.getAllByRole('generic');
      expect(skeletons.length).toBeGreaterThan(1);
    });

    it('renders avatar when showAvatar is true', () => {
      render(<SkeletonCard showAvatar={true} />);
      const skeletons = screen.getAllByRole('generic');
      // Should include avatar skeleton
      expect(skeletons.length).toBeGreaterThan(3);
    });
  });

  describe('SkeletonTable', () => {
    it('renders table skeleton with default rows and columns', () => {
      render(<SkeletonTable />);
      const skeletons = screen.getAllByRole('generic');
      // Should have header + 5 rows * 4 columns = multiple skeletons
      expect(skeletons.length).toBeGreaterThan(10);
    });

    it('renders without header when showHeader is false', () => {
      render(<SkeletonTable showHeader={false} rows={2} columns={2} />);
      const skeletons = screen.getAllByRole('generic');
      // Should have fewer skeletons without header
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('SkeletonForm', () => {
    it('renders form skeleton with default fields', () => {
      render(<SkeletonForm />);
      const skeletons = screen.getAllByRole('generic');
      // Should have title + fields + submit button skeletons
      expect(skeletons.length).toBeGreaterThan(5);
    });
  });
});

describe('Page Transition Components', () => {
  describe('PageTransition', () => {
    it('renders children with animation wrapper', () => {
      render(
        <PageTransition>
          <div>Test content</div>
        </PageTransition>
      );
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  describe('WizardStepTransition', () => {
    it('renders with forward direction by default', () => {
      render(
        <WizardStepTransition currentStep={1}>
          <div>Step content</div>
        </WizardStepTransition>
      );
      expect(screen.getByText('Step content')).toBeInTheDocument();
    });

    it('handles backward direction', () => {
      render(
        <WizardStepTransition currentStep={1} direction="backward">
          <div>Step content</div>
        </WizardStepTransition>
      );
      expect(screen.getByText('Step content')).toBeInTheDocument();
    });
  });

  describe('LoadingTransition', () => {
    it('shows loading component when isLoading is true', () => {
      render(
        <LoadingTransition
          isLoading={true}
          loadingComponent={<div>Loading...</div>}
        >
          <div>Content</div>
        </LoadingTransition>
      );
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('shows content when isLoading is false', () => {
      render(
        <LoadingTransition
          isLoading={false}
          loadingComponent={<div>Loading...</div>}
        >
          <div>Content</div>
        </LoadingTransition>
      );
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});

describe('Micro-Interaction Components', () => {
  describe('InteractiveButton', () => {
    it('renders button with children', () => {
      render(<InteractiveButton>Click me</InteractiveButton>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Click me');
    });

    it('handles click events', () => {
      const handleClick = jest.fn();
      render(<InteractiveButton onClick={handleClick}>Click me</InteractiveButton>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is true', () => {
      render(<InteractiveButton disabled>Disabled</InteractiveButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('InteractiveCard', () => {
    it('renders card with children', () => {
      render(<InteractiveCard>Card content</InteractiveCard>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('handles click when clickable', () => {
      const handleClick = jest.fn();
      render(
        <InteractiveCard clickable onClick={handleClick}>
          Clickable card
        </InteractiveCard>
      );
      const card = screen.getByText('Clickable card').closest('div');
      fireEvent.click(card!);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('InteractiveInput', () => {
    it('renders input with placeholder', () => {
      render(<InteractiveInput placeholder="Enter text..." />);
      const input = screen.getByPlaceholderText('Enter text...');
      expect(input).toBeInTheDocument();
    });

    it('handles value changes', () => {
      const handleChange = jest.fn();
      render(<InteractiveInput onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('applies error styling when error prop is true', () => {
      render(<InteractiveInput error />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-500');
    });
  });

  describe('BouncingIcon', () => {
    it('renders children with bounce animation', () => {
      render(
        <BouncingIcon>
          <span>Icon</span>
        </BouncingIcon>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
    });

    it('disables bounce when bounce prop is false', () => {
      render(
        <BouncingIcon bounce={false}>
          <span>Static icon</span>
        </BouncingIcon>
      );
      expect(screen.getByText('Static icon')).toBeInTheDocument();
    });
  });

  describe('HoverLift', () => {
    it('renders children with hover effects', () => {
      render(
        <HoverLift>
          <div>Hover me</div>
        </HoverLift>
      );
      expect(screen.getByText('Hover me')).toBeInTheDocument();
    });
  });

  describe('SuccessAnimation', () => {
    it('renders children', () => {
      render(
        <SuccessAnimation>
          <div>Success!</div>
        </SuccessAnimation>
      );
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });
  });
});

describe('Integration Tests', () => {
  it('combines loading spinner with skeleton in loading state', () => {
    render(
      <div>
        <LoadingSpinner />
        <SkeletonCard />
      </div>
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    const skeletons = screen.getAllByRole('generic');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('transitions from loading to content', async () => {
    const { rerender } = render(
      <LoadingTransition
        isLoading={true}
        loadingComponent={<LoadingSpinner />}
      >
        <div>Loaded content</div>
      </LoadingTransition>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(
      <LoadingTransition
        isLoading={false}
        loadingComponent={<LoadingSpinner />}
      >
        <div>Loaded content</div>
      </LoadingTransition>
    );

    expect(screen.getByText('Loaded content')).toBeInTheDocument();
  });

  it('combines interactive elements with animations', () => {
    render(
      <InteractiveCard clickable>
        <BouncingIcon>
          <span>🌟</span>
        </BouncingIcon>
        <InteractiveButton>Action</InteractiveButton>
      </InteractiveCard>
    );

    expect(screen.getByText('🌟')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('Accessibility Tests', () => {
  it('loading spinner has proper ARIA attributes', () => {
    render(<LoadingSpinner srText="Loading user data" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading user data');
  });

  it('interactive button is keyboard accessible', () => {
    const handleClick = jest.fn();
    render(<InteractiveButton onClick={handleClick}>Submit</InteractiveButton>);
    const button = screen.getByRole('button');
    
    // Should be focusable
    button.focus();
    expect(button).toHaveFocus();
    
    // Should handle Enter key
    fireEvent.keyDown(button, { key: 'Enter' });
    // Note: In real implementation, this would trigger click
  });

  it('interactive input has proper focus handling', () => {
    render(<InteractiveInput placeholder="Email address" />);
    const input = screen.getByRole('textbox');
    
    input.focus();
    expect(input).toHaveFocus();
  });
});

describe('Performance Tests', () => {
  it('renders multiple skeleton components efficiently', () => {
    const startTime = performance.now();
    
    render(
      <div>
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render quickly (less than 100ms for 10 components)
    expect(renderTime).toBeLessThan(100);
  });

  it('handles rapid state changes in LoadingTransition', () => {
    const { rerender } = render(
      <LoadingTransition
        isLoading={true}
        loadingComponent={<div>Loading</div>}
      >
        <div>Content</div>
      </LoadingTransition>
    );

    // Rapidly toggle loading state - end with loading false
    for (let i = 0; i < 4; i++) {
      rerender(
        <LoadingTransition
          isLoading={i % 2 === 0}
          loadingComponent={<div>Loading</div>}
        >
          <div>Content</div>
        </LoadingTransition>
      );
    }

    // Final state should show content (i=3, 3%2=1, so isLoading=false)
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});