/**
 * Wizard Container Layout Tests
 * Tests for task 6.1: Create wizard container layout
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

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('Wizard Container Layout', () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with proper container layout', () => {
    render(
      <ContractWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    );

    // Check that the wizard renders
    expect(screen.getByText('Novo Contrato')).toBeInTheDocument();
    expect(screen.getByText('Sistema de Contratos Fotovoltaicos')).toBeInTheDocument();
  });

  it('should have max-width container with proper classes', () => {
    const { container } = render(
      <ContractWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    );

    // Find the container element with max-w-4xl class
    const containerElement = container.querySelector('.max-w-4xl');
    expect(containerElement).toBeInTheDocument();
    
    // Check for responsive padding classes
    expect(containerElement).toHaveClass('px-4', 'py-8');
    
    // Check for centering (mx-auto should be applied by Container component)
    expect(containerElement).toHaveClass('mx-auto');
  });

  it('should display the ISOTEC logo with proper sizing', () => {
    render(
      <ContractWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    );

    const logo = screen.getByAltText('ISOTEC Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveClass('w-32', 'md:w-40');
  });

  it('should display the cancel button', () => {
    render(
      <ContractWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    );

    const cancelButton = screen.getByText('Cancelar');
    expect(cancelButton).toBeInTheDocument();
  });

  it('should display the progress indicator', () => {
    render(
      <ContractWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    );

    // Check for progress indicator mock content
    expect(screen.getByText('Step 1 of 7')).toBeInTheDocument();
    
    // Check for step titles on desktop (hidden on mobile) - use getAllByText since text appears in both progress and card header
    const identificacaoElements = screen.getAllByText('Identificação');
    expect(identificacaoElements.length).toBeGreaterThan(0);
    
    const dadosElements = screen.getAllByText('Dados do contratante');
    expect(dadosElements.length).toBeGreaterThan(0);
  });

  it('should display the first step content by default', () => {
    render(
      <ContractWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    );

    // Should show step 1 content
    expect(screen.getByTestId('step-1')).toBeInTheDocument();
  });

  it('should have proper background gradient', () => {
    const { container } = render(
      <ContractWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    );

    const backgroundElement = container.querySelector('.min-h-screen');
    expect(backgroundElement).toHaveClass(
      'bg-gradient-to-br',
      'from-neutral-900',
      'via-neutral-800',
      'to-ocean-900'
    );
  });

  it('should display navigation buttons', () => {
    render(
      <ContractWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    );

    // Should show Previous button (disabled on first step)
    const previousButton = screen.getByText('Anterior');
    expect(previousButton).toBeInTheDocument();
    expect(previousButton).toBeDisabled();

    // Should show Next button
    const nextButton = screen.getByText('Próximo');
    expect(nextButton).toBeInTheDocument();
    expect(nextButton).not.toBeDisabled();
  });
});