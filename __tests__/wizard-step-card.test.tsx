/**
 * Wizard Step Content Card Tests
 * Tests for task 6.4: Enhance wizard step content card
 * 
 * Requirements: 1.5, 8.5
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContractWizard } from '@/components/wizard/ContractWizard';

// Mock the step components to avoid complex dependencies
jest.mock('@/components/wizard/steps/Step1ContractorInfo', () => ({
  Step1ContractorInfo: () => <div data-testid="step-1">Step 1 Content</div>
}));

jest.mock('@/components/wizard/steps/Step2Address', () => ({
  Step2Address: () => <div data-testid="step-2">Step 2 Content</div>
}));

jest.mock('@/components/wizard/steps/Step3ProjectSpecs', () => ({
  Step3ProjectSpecs: () => <div data-testid="step-3">Step 3 Content</div>
}));

jest.mock('@/components/wizard/steps/Step4Equipment', () => ({
  Step4Equipment: () => <div data-testid="step-4">Step 4 Content</div>
}));

jest.mock('@/components/wizard/steps/Step5Services', () => ({
  Step5Services: () => <div data-testid="step-5">Step 5 Content</div>
}));

jest.mock('@/components/wizard/steps/Step6Financial', () => ({
  Step6Financial: () => <div data-testid="step-6">Step 6 Content</div>
}));

jest.mock('@/components/wizard/steps/Step7Review', () => ({
  Step7Review: () => <div data-testid="step-7">Step 7 Content</div>
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, priority, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock WizardProgress component
jest.mock('@/components/ui/wizard-progress', () => ({
  WizardProgress: ({ steps, currentStep, className }: any) => (
    <div className={className} data-testid="wizard-progress">
      <div>Step {currentStep} of {steps.length}</div>
    </div>
  ),
}));

// Mock Container component
jest.mock('@/components/ui/container', () => ({
  Container: ({ children, className, ...props }: any) => (
    <div className={`max-w-4xl mx-auto px-4 py-8 ${className || ''}`} {...props}>
      {children}
    </div>
  ),
}));

// Mock Card components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={className} {...props}>
      {children}
    </h3>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <p className={className} {...props}>
      {children}
    </p>
  ),
}));

// Mock Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className, variant, disabled, onClick, ...props }: any) => (
    <button 
      className={className} 
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, initial, animate, exit, transition, ...props }: any) => (
      <div 
        className={className} 
        data-testid="animated-content"
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        data-exit={JSON.stringify(exit)}
        data-transition={JSON.stringify(transition)}
        {...props}
      >
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock React Hook Form
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    handleSubmit: (fn: any) => fn,
    trigger: jest.fn().mockResolvedValue(true),
    formState: { errors: {} },
    register: jest.fn(),
    watch: jest.fn(),
    setValue: jest.fn(),
    getValues: jest.fn(),
  }),
  FormProvider: ({ children }: any) => children,
}));

// Mock other dependencies
jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => ({}),
}));

jest.mock('@/lib/types/schemas', () => ({
  contractDraftSchema: {},
}));

describe('Wizard Step Content Card Enhancements', () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should apply rounded-xl shadow-lg styling to the card', () => {
    const { container } = render(
      <ContractWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    );

    // Find the main card element
    const cardElement = container.querySelector('[class*="bg-neutral-800/50"]');
    expect(cardElement).toBeInTheDocument();
    
    // Check for rounded-xl styling
    expect(cardElement).toHaveClass('rounded-xl');
    
    // Check for shadow-lg styling
    expect(cardElement).toHaveClass('shadow-lg');
  });

  it('should set minimum height of 500px on the card', () => {
    const { container } = render(
      <ContractWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    );

    // Find the main card element
    const cardElement = container.querySelector('[class*="bg-neutral-800/50"]');
    expect(cardElement).toBeInTheDocument();
    
    // Check for minimum height
    expect(cardElement).toHaveClass('min-h-[500px]');
  });

  it('should implement responsive padding (p-6 md:p-8) on card header', () => {
    const { container } = render(
      <ContractWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    );

    // Find the card header element
    const headerElement = container.querySelector('[class*="p-6"][class*="md:p-8"][class*="pb-4"]');
    expect(headerElement).toBeInTheDocument();
    
    // Check for responsive padding classes
    expect(headerElement).toHaveClass('p-6', 'md:p-8', 'pb-4');
  });

  it('should implement responsive padding (p-6 md:p-8) on card content', () => {
    const { container } = render(
      <ContractWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    );

    // Find the card content element
    const contentElement = container.querySelector('[class*="p-6"][class*="md:p-8"][class*="pt-0"]');
    expect(contentElement).toBeInTheDocument();
    
    // Check for responsive padding classes
    expect(contentElement).toHaveClass('p-6', 'md:p-8', 'pt-0');
  });

  it('should implement responsive padding (p-6 md:p-8) on navigation section', () => {
    const { container } = render(
      <ContractWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    );

    // Find the navigation section element
    const navElement = container.querySelector('[class*="p-6"][class*="md:p-8"][class*="pt-6"]');
    expect(navElement).toBeInTheDocument();
    
    // Check for responsive padding classes
    expect(navElement).toHaveClass('p-6', 'md:p-8', 'pt-6');
  });

  it('should add slide transition animation between steps', () => {
    const { container } = render(
      <ContractWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    );

    // Find the animated content element within the card content (not the mascot)
    const cardContent = container.querySelector('[class*="p-6"][class*="md:p-8"][class*="pt-0"]');
    expect(cardContent).toBeInTheDocument();
    
    const animatedElement = cardContent?.querySelector('[data-testid="animated-content"]');
    expect(animatedElement).toBeInTheDocument();

    // Check animation properties
    const initial = JSON.parse(animatedElement?.getAttribute('data-initial') || '{}');
    const animate = JSON.parse(animatedElement?.getAttribute('data-animate') || '{}');
    const exit = JSON.parse(animatedElement?.getAttribute('data-exit') || '{}');
    const transition = JSON.parse(animatedElement?.getAttribute('data-transition') || '{}');

    // Verify slide animation properties
    expect(initial).toEqual({ opacity: 0, x: 20 });
    expect(animate).toEqual({ opacity: 1, x: 0 });
    expect(exit).toEqual({ opacity: 0, x: -20 });
    expect(transition).toEqual({ duration: 0.3, ease: "easeInOut" });
  });

  it('should maintain proper content structure with enhanced styling', () => {
    render(
      <ContractWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    );

    // Verify step content is rendered
    expect(screen.getByTestId('step-1')).toBeInTheDocument();
    
    // Verify card header content
    expect(screen.getByText('Identificação')).toBeInTheDocument();
    expect(screen.getByText('Dados do contratante')).toBeInTheDocument();
    
    // Verify navigation buttons
    expect(screen.getByText('Anterior')).toBeInTheDocument();
    expect(screen.getByText('Próximo')).toBeInTheDocument();
  });

  it('should preserve existing card styling while adding enhancements', () => {
    const { container } = render(
      <ContractWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    );

    // Find the main card element
    const cardElement = container.querySelector('[class*="bg-neutral-800/50"]');
    expect(cardElement).toBeInTheDocument();
    
    // Check that existing styling is preserved
    expect(cardElement).toHaveClass('bg-neutral-800/50');
    expect(cardElement).toHaveClass('border-neutral-700');
    
    // Check that new enhancements are added
    expect(cardElement).toHaveClass('rounded-xl');
    expect(cardElement).toHaveClass('shadow-lg');
    expect(cardElement).toHaveClass('min-h-[500px]');
  });

  it('should maintain proper content minimum height', () => {
    const { container } = render(
      <ContractWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    );

    // Find the animated content wrapper
    const contentWrapper = container.querySelector('[class*="min-h-[400px]"]');
    expect(contentWrapper).toBeInTheDocument();
    expect(contentWrapper).toHaveClass('min-h-[400px]');
  });
});