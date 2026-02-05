/**
 * EmailSignature Responsive Tests
 * Tests specifically for responsive behavior and mobile optimizations
 * 
 * Requirements: 12.6, 3.7
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

// Mock window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('EmailSignature Responsive Behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  describe('Mobile Viewport (320px - 767px)', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
    });

    it('should have larger touch targets on mobile', () => {
      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Progress indicator circles should be larger on mobile (w-12 h-12)
      const progressSteps = document.querySelectorAll('[class*="w-12 h-12 sm:w-10 sm:h-10"]');
      expect(progressSteps.length).toBeGreaterThan(0);
      
      // Main button should have minimum touch target
      const sendButton = screen.getByText('Enviar Código de Verificação');
      const buttonElement = sendButton.closest('button');
      expect(buttonElement).toHaveClass('min-h-[48px]');
    });

    it('should use smaller text sizes on mobile', () => {
      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Step labels should use smaller text on mobile
      const stepLabel = screen.getByText('1. Inserir E-mail');
      expect(stepLabel).toHaveClass('text-xs');
      expect(stepLabel).toHaveClass('sm:text-sm');
    });

    it('should optimize spacing for mobile', () => {
      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Progress indicator should have tighter spacing on mobile
      const progressContainer = document.querySelector('[class*="space-x-2 sm:space-x-4"]');
      expect(progressContainer).toBeInTheDocument();
    });

    it('should handle code input responsively', async () => {
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
      
      // Wait for code input to appear
      await screen.findByPlaceholderText('000000');
      
      const codeInput = screen.getByPlaceholderText('000000');
      
      // Should use mobile-optimized text size and spacing
      expect(codeInput).toHaveClass('text-2xl'); // Mobile size
      expect(codeInput).toHaveClass('sm:text-3xl'); // Desktop size
      expect(codeInput).toHaveClass('tracking-[0.3em]'); // Mobile tracking
      expect(codeInput).toHaveClass('sm:tracking-[0.5em]'); // Desktop tracking
      expect(codeInput).toHaveClass('min-h-[60px]'); // Mobile height
      expect(codeInput).toHaveClass('sm:min-h-[72px]'); // Desktop height
    });

    it('should stack error recovery buttons vertically on mobile', async () => {
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
      
      // Wait for error to appear
      await screen.findByText('Erro de conexão. Verifique sua internet e tente novamente.');
      
      // Error buttons should be stacked vertically (flex-col) on mobile
      const errorContainer = document.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(errorContainer).toBeInTheDocument();
      
      // Buttons should be full width on mobile
      const retryButtons = screen.getAllByText('Tentar Novamente');
      const retryButton = retryButtons[0].closest('button');
      expect(retryButton).toHaveClass('w-full');
      expect(retryButton).toHaveClass('sm:w-auto');
    });
  });

  describe('Tablet Viewport (768px - 1023px)', () => {
    beforeEach(() => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });

    it('should use intermediate sizing on tablet', () => {
      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Should still use responsive classes that work on tablet
      const stepLabel = screen.getByText('1. Inserir E-mail');
      expect(stepLabel).toHaveClass('text-xs');
      expect(stepLabel).toHaveClass('sm:text-sm'); // Should apply on tablet
    });
  });

  describe('Desktop Viewport (1024px+)', () => {
    beforeEach(() => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 800,
      });
    });

    it('should use larger elements on desktop', () => {
      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Progress circles should be smaller on desktop (sm:w-10 sm:h-10)
      const progressSteps = document.querySelectorAll('[class*="w-12 h-12 sm:w-10 sm:h-10"]');
      expect(progressSteps.length).toBeGreaterThan(0);
      
      // Step labels should use larger text on desktop
      const stepLabel = screen.getByText('1. Inserir E-mail');
      expect(stepLabel).toHaveClass('sm:text-sm');
    });
  });

  describe('Accessibility on Mobile', () => {
    it('should maintain proper focus management on mobile', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Tab through elements
      await user.tab();
      
      // Email input should be focusable
      const emailInput = screen.getByLabelText('E-mail para Assinatura');
      expect(emailInput).toHaveFocus();
      
      // Type email to enable the button
      await user.type(emailInput, 'test@example.com');
      
      await user.tab();
      
      // Send button should be focusable when enabled
      const sendButton = screen.getByRole('button', { name: /enviar código de verificação/i });
      expect(sendButton).toHaveFocus();
      expect(sendButton).not.toBeDisabled();
    });

    it('should have proper ARIA labels on mobile', () => {
      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      // Form elements should have proper labels
      const emailInput = screen.getByLabelText('E-mail para Assinatura');
      expect(emailInput).toBeInTheDocument();
      
      // Buttons should have accessible text
      const sendButton = screen.getByRole('button', { name: /enviar código de verificação/i });
      expect(sendButton).toBeInTheDocument();
    });
  });

  describe('Long Content Handling', () => {
    it('should handle long email addresses without overflow', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ expiresAt: '2024-01-01T12:00:00Z' }),
      });

      const longEmail = 'very.very.very.long.email.address.that.could.potentially.overflow@extremely-long-domain-name-that-might-cause-issues.com';

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
      
      // Wait for code step
      await screen.findByText('Verificação de Código');
      
      // Long email should be displayed with proper word breaking
      const emailDisplay = screen.getByText(longEmail);
      const container = emailDisplay.closest('p');
      expect(container).toHaveClass('break-words');
    });

    it('should handle long error messages gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API error with long message
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('This is a very long error message that could potentially cause layout issues on mobile devices with small screens'));

      render(
        <TestWrapper>
          <EmailSignature contractId="test-contract" />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText('E-mail para Assinatura');
      await user.type(emailInput, 'test@example.com');
      
      const sendButton = screen.getByText('Enviar Código de Verificação');
      await user.click(sendButton);
      
      // Wait for error
      await screen.findByText('Erro de conexão. Verifique sua internet e tente novamente.');
      
      // Error message container should handle long text properly
      const errorContainer = document.querySelector('.break-words');
      expect(errorContainer).toBeInTheDocument();
    });
  });

  describe('Network Status on Mobile', () => {
    it('should show network status indicator prominently on mobile', () => {
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

      // Network status should be visible and properly sized for mobile
      const networkStatus = screen.getByText('Sem conexão com a internet');
      expect(networkStatus).toBeInTheDocument();
      
      // Container should have mobile-optimized padding
      const container = networkStatus.closest('div');
      expect(container).toHaveClass('p-3');
      expect(container).toHaveClass('sm:p-4');
    });
  });
});