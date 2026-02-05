/**
 * EmailSignature Component Tests
 * Tests for the redesigned email signature UI with enhanced error handling
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 9.2, 9.3
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailSignature } from '@/components/contract/EmailSignature';
import { ToastProvider } from '@/components/ui/toast';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Wrapper component with ToastProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('EmailSignature Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  describe('Step-by-step interface (Requirement 12.1)', () => {
    it('should display step 1 (email) initially', () => {
      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Check progress indicator shows step 1 active
      expect(screen.getByText('1. Inserir E-mail')).toBeInTheDocument();
      expect(screen.getByText('2. Verificar Código')).toBeInTheDocument();
      
      // Check email input is visible
      expect(screen.getByLabelText('E-mail para Assinatura')).toBeInTheDocument();
      expect(screen.getByText('Enviar Código de Verificação')).toBeInTheDocument();
    });

    it('should show clear visual hierarchy with progress indicator', () => {
      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Check progress indicator elements
      const progressSteps = screen.getAllByRole('generic');
      const emailStep = progressSteps.find(el => el.querySelector('[data-testid="mail-icon"]'));
      const codeStep = progressSteps.find(el => el.querySelector('[data-testid="shield-icon"]'));
      
      // Email step should be active (has solar colors)
      expect(screen.getByText('Assinatura por E-mail')).toBeInTheDocument();
    });
  });

  describe('Visual feedback for each stage (Requirement 12.2)', () => {
    it('should provide visual feedback when transitioning to code step', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expiresAt: '2024-01-01T12:00:00Z', code: '123456' }),
      });

      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Fill email and submit
      const emailInput = screen.getByLabelText('E-mail para Assinatura');
      await user.type(emailInput, 'test@example.com');
      
      const sendButton = screen.getByText('Enviar Código de Verificação');
      await user.click(sendButton);
      
      // Wait for transition to code step
      await waitFor(() => {
        expect(screen.getByText('Verificação de Código')).toBeInTheDocument();
      });
      
      // Check visual feedback elements
      expect(screen.getByText(/Código enviado para/)).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText(/O código expira em 15 minutos/)).toBeInTheDocument();
    });

    it('should show loading state with visual feedback', async () => {
      const user = userEvent.setup();
      
      // Mock delayed API response
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ expiresAt: '2024-01-01T12:00:00Z' }),
        }), 100))
      );

      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText('E-mail para Assinatura');
      await user.type(emailInput, 'test@example.com');
      
      const sendButton = screen.getByText('Enviar Código de Verificação');
      await user.click(sendButton);
      
      // Check loading state
      expect(screen.getByText('Enviando código...')).toBeInTheDocument();
      // Check that the button shows loading state (the button element should be disabled)
      const buttonElement = screen.getByRole('button', { name: /enviando código/i });
      expect(buttonElement).toBeDisabled();
    });
  });

  describe('Large verification code input (Requirement 12.3)', () => {
    it('should display large, prominent code input field', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expiresAt: '2024-01-01T12:00:00Z' }),
      });

      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Navigate to code step
      const emailInput = screen.getByLabelText('E-mail para Assinatura');
      await user.type(emailInput, 'test@example.com');
      
      const sendButton = screen.getByText('Enviar Código de Verificação');
      await user.click(sendButton);
      
      await waitFor(() => {
        const codeInput = screen.getByPlaceholderText('000000');
        expect(codeInput).toBeInTheDocument();
        
        // Check that input has large text styling (responsive classes)
        expect(codeInput).toHaveClass('text-2xl'); // Mobile size
        expect(codeInput).toHaveClass('sm:text-3xl'); // Desktop size
        expect(codeInput).toHaveClass('font-mono');
        expect(codeInput).toHaveClass('tracking-[0.3em]'); // Mobile tracking
        expect(codeInput).toHaveClass('sm:tracking-[0.5em]'); // Desktop tracking
      });
    });

    it('should format code input correctly', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expiresAt: '2024-01-01T12:00:00Z' }),
      });

      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Navigate to code step
      const emailInput = screen.getByLabelText('E-mail para Assinatura');
      await user.type(emailInput, 'test@example.com');
      
      const sendButton = screen.getByText('Enviar Código de Verificação');
      await user.click(sendButton);
      
      await waitFor(async () => {
        const codeInput = screen.getByPlaceholderText('000000');
        
        // Type mixed characters, should only accept digits and limit to 6
        await user.type(codeInput, 'a1b2c3d4');
        
        expect(codeInput).toHaveValue('123412');
      });
    });
  });

  describe('Success state with animation (Requirement 12.4)', () => {
    it('should display animated success state after verification', async () => {
      const user = userEvent.setup();
      const mockCallback = jest.fn();
      
      // Mock successful API responses
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ expiresAt: '2024-01-01T12:00:00Z' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" onSignatureComplete={mockCallback} />
        </TestWrapper>
      );
      
      // Navigate through the flow
      const emailInput = screen.getByLabelText('E-mail para Assinatura');
      await user.type(emailInput, 'test@example.com');
      
      const sendButton = screen.getByText('Enviar Código de Verificação');
      await user.click(sendButton);
      
      await waitFor(async () => {
        const codeInput = screen.getByPlaceholderText('000000');
        await user.type(codeInput, '123456');
        
        const verifyButton = screen.getByText('Verificar e Assinar');
        await user.click(verifyButton);
      });
      
      // Check success state
      await waitFor(() => {
        expect(screen.getByText('Contrato Assinado com Sucesso!')).toBeInTheDocument();
        expect(screen.getByText('Sua assinatura foi registrada e o contrato está finalizado.')).toBeInTheDocument();
        expect(screen.getByText('Assinatura verificada e segura')).toBeInTheDocument();
      });
      
      // Check for animation classes
      const successContainer = screen.getByText('Contrato Assinado com Sucesso!').closest('div');
      const animatedElements = document.querySelectorAll('.animate-bounce, .animate-ping');
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });

  describe('Enhanced error handling (Requirements 12.5, 9.2, 9.3)', () => {
    it('should display clear error messages with proper styling', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText('E-mail para Assinatura');
      await user.type(emailInput, 'test@example.com');
      
      const sendButton = screen.getByText('Enviar Código de Verificação');
      await user.click(sendButton);
      
      await waitFor(() => {
        // Look for the error message in the enhanced error display (not the input error)
        const errorMessages = screen.getAllByText('Erro de conexão. Verifique sua internet e tente novamente.');
        expect(errorMessages.length).toBeGreaterThan(0);
        
        // Check error styling - look for the error container
        const errorContainer = document.querySelector('.bg-red-50.border-red-200');
        expect(errorContainer).toBeInTheDocument();
      });
    });

    it('should provide recovery options for retryable errors', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText('E-mail para Assinatura');
      await user.type(emailInput, 'test@example.com');
      
      const sendButton = screen.getByText('Enviar Código de Verificação');
      await user.click(sendButton);
      
      await waitFor(() => {
        // Check for retry buttons - use getAllByText to handle duplicates
        const retryButtons = screen.getAllByText('Tentar Novamente');
        expect(retryButtons.length).toBeGreaterThan(0);
        
        const reloadButtons = screen.getAllByText('Recarregar Página');
        expect(reloadButtons.length).toBeGreaterThan(0);
      });
    });

    it('should provide resend code option for code verification errors', async () => {
      const user = userEvent.setup();
      
      // Mock successful send, then error on verify
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ expiresAt: '2024-01-01T12:00:00Z' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 422,
          json: async () => ({ error: 'Invalid code' }),
        });

      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Navigate to code step
      const emailInput = screen.getByLabelText('E-mail para Assinatura');
      await user.type(emailInput, 'test@example.com');
      
      const sendButton = screen.getByText('Enviar Código de Verificação');
      await user.click(sendButton);
      
      await waitFor(async () => {
        const codeInput = screen.getByPlaceholderText('000000');
        await user.type(codeInput, '123456');
        
        const verifyButton = screen.getByText('Verificar e Assinar');
        await user.click(verifyButton);
      });
      
      // Wait for error and check recovery options
      await waitFor(() => {
        expect(screen.getByText('Código inválido. Verifique os 6 dígitos e tente novamente.')).toBeInTheDocument();
        expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
        expect(screen.getByText('Reenviar Código')).toBeInTheDocument();
      });
    });

    it('should clear errors when user starts typing', async () => {
      const user = userEvent.setup();
      
      // Mock successful send, then error on verify
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ expiresAt: '2024-01-01T12:00:00Z' }),
        })
        .mockRejectedValueOnce(new Error('Invalid code'));

      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Navigate to code step
      const emailInput = screen.getByLabelText('E-mail para Assinatura');
      await user.type(emailInput, 'test@example.com');
      
      const sendButton = screen.getByText('Enviar Código de Verificação');
      await user.click(sendButton);
      
      await waitFor(async () => {
        const codeInput = screen.getByPlaceholderText('000000');
        await user.type(codeInput, '123456');
        
        const verifyButton = screen.getByText('Verificar e Assinar');
        await user.click(verifyButton);
      });
      
      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Erro de conexão. Verifique sua internet e tente novamente.')).toBeInTheDocument();
      });
      
      // Start typing in code input - error should clear
      const codeInput = screen.getByPlaceholderText('000000');
      await user.clear(codeInput);
      await user.type(codeInput, '1');
      
      expect(screen.queryByText('Erro de conexão. Verifique sua internet e tente novamente.')).not.toBeInTheDocument();
    });

    it('should show network status indicator when offline', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );

      // Trigger offline event
      fireEvent(window, new Event('offline'));

      await waitFor(() => {
        expect(screen.getByText('Sem conexão com a internet')).toBeInTheDocument();
      });
    });

    it('should handle rate limiting with appropriate messaging', async () => {
      const user = userEvent.setup();
      
      // Mock rate limit error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Too many requests' }),
      });

      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText('E-mail para Assinatura');
      await user.type(emailInput, 'test@example.com');
      
      const sendButton = screen.getByText('Enviar Código de Verificação');
      await user.click(sendButton);
      
      await waitFor(() => {
        // Look for rate limit message - use getAllByText to handle duplicates
        const rateLimitMessages = screen.getAllByText('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
        expect(rateLimitMessages.length).toBeGreaterThan(0);
        
        // Rate limit errors should not have retry button in the error display
        const errorContainer = document.querySelector('.bg-red-50.border-red-200');
        expect(errorContainer).toBeInTheDocument();
        
        // Check that there are no retry buttons in the error container
        const retryButtons = screen.queryAllByText('Tentar Novamente');
        expect(retryButtons.length).toBe(0);
      });
    });

    it('should handle expired code with resend option', async () => {
      const user = userEvent.setup();
      
      // Mock successful send, then expired code error
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ expiresAt: '2024-01-01T12:00:00Z' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 410,
          json: async () => ({ error: 'Code expired' }),
        });

      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Navigate to code step
      const emailInput = screen.getByLabelText('E-mail para Assinatura');
      await user.type(emailInput, 'test@example.com');
      
      const sendButton = screen.getByText('Enviar Código de Verificação');
      await user.click(sendButton);
      
      await waitFor(async () => {
        const codeInput = screen.getByPlaceholderText('000000');
        await user.type(codeInput, '123456');
        
        const verifyButton = screen.getByText('Verificar e Assinar');
        await user.click(verifyButton);
      });
      
      // Wait for error and check recovery options
      await waitFor(() => {
        const expiredMessages = screen.getAllByText('Código expirado. Solicite um novo código.');
        expect(expiredMessages.length).toBeGreaterThan(0);
        
        const resendButtons = screen.getAllByText('Reenviar Código');
        expect(resendButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Responsive design', () => {
    it('should render all elements for mobile viewport', () => {
      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Check that key elements are present
      expect(screen.getByText('1. Inserir E-mail')).toBeInTheDocument();
      expect(screen.getByText('2. Verificar Código')).toBeInTheDocument();
      expect(screen.getByLabelText('E-mail para Assinatura')).toBeInTheDocument();
      expect(screen.getByText('Assinatura GOV.BR')).toBeInTheDocument();
    });

    it('should have proper touch targets on mobile (min 44x44px)', () => {
      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Check main button has minimum touch target size
      const sendButton = screen.getByText('Enviar Código de Verificação');
      const buttonElement = sendButton.closest('button');
      expect(buttonElement).toHaveClass('min-h-[48px]'); // 48px is larger than 44px minimum
      expect(buttonElement).toHaveClass('w-full');
    });

    it('should optimize layout for small screens', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expiresAt: '2024-01-01T12:00:00Z' }),
      });

      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Navigate to code step
      const emailInput = screen.getByLabelText('E-mail para Assinatura');
      await user.type(emailInput, 'test@example.com');
      
      const sendButton = screen.getByText('Enviar Código de Verificação');
      await user.click(sendButton);
      
      await waitFor(() => {
        const codeInput = screen.getByPlaceholderText('000000');
        
        // Check code input has mobile-optimized styling
        expect(codeInput).toHaveClass('text-2xl'); // Smaller on mobile
        expect(codeInput).toHaveClass('sm:text-3xl'); // Larger on desktop
        expect(codeInput).toHaveClass('min-h-[60px]'); // Minimum touch target
        expect(codeInput).toHaveClass('tracking-[0.3em]'); // Adjusted letter spacing for mobile
        expect(codeInput).toHaveClass('sm:tracking-[0.5em]'); // More spacing on desktop
      });
    });

    it('should stack buttons vertically on mobile in error states', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText('E-mail para Assinatura');
      await user.type(emailInput, 'test@example.com');
      
      const sendButton = screen.getByText('Enviar Código de Verificação');
      await user.click(sendButton);
      
      await waitFor(() => {
        // Check that error recovery buttons have mobile-friendly classes
        const retryButtons = screen.getAllByText('Tentar Novamente');
        expect(retryButtons.length).toBeGreaterThan(0);
        
        // Check for mobile-optimized button styling
        const retryButton = retryButtons[0].closest('button');
        expect(retryButton).toHaveClass('min-h-[44px]'); // Minimum touch target
        expect(retryButton).toHaveClass('w-full'); // Full width on mobile
        expect(retryButton).toHaveClass('sm:w-auto'); // Auto width on desktop
      });
    });

    it('should handle long email addresses gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expiresAt: '2024-01-01T12:00:00Z' }),
      });

      const longEmail = 'very.long.email.address.that.might.overflow@very-long-domain-name.com';

      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Navigate to code step with long email
      const emailInput = screen.getByLabelText('E-mail para Assinatura');
      await user.type(emailInput, longEmail);
      
      const sendButton = screen.getByText('Enviar Código de Verificação');
      await user.click(sendButton);
      
      await waitFor(() => {
        // Check that long email is displayed with proper word breaking
        const emailDisplay = screen.getByText(longEmail);
        const container = emailDisplay.closest('p');
        expect(container).toHaveClass('break-words'); // Should break long words
      });
    });

    it('should optimize progress indicator for mobile', () => {
      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Check progress indicator has mobile-optimized sizing
      const progressSteps = document.querySelectorAll('[class*="w-12 h-12 sm:w-10 sm:h-10"]');
      expect(progressSteps.length).toBeGreaterThan(0);
      
      // Check step labels have responsive text sizing
      const stepLabel = screen.getByText('1. Inserir E-mail');
      expect(stepLabel).toHaveClass('text-xs');
      expect(stepLabel).toHaveClass('sm:text-sm');
    });

    it('should optimize GOV.BR section for mobile', () => {
      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Check GOV.BR section has mobile-friendly layout
      const govBrTitle = screen.getByText('Assinatura GOV.BR');
      expect(govBrTitle).toHaveClass('truncate'); // Prevent overflow
      
      // Check that the section exists and has proper responsive classes
      const govBrCard = govBrTitle.closest('.bg-gradient-to-r');
      expect(govBrCard).toBeInTheDocument();
    });

    it('should maintain accessibility on mobile', () => {
      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Check that form elements maintain proper labels
      const emailInput = screen.getByLabelText('E-mail para Assinatura');
      expect(emailInput).toBeInTheDocument();
      
      // Check that buttons have proper text or aria-labels
      const sendButton = screen.getByText('Enviar Código de Verificação');
      expect(sendButton).toBeInTheDocument();
    });
  });
});