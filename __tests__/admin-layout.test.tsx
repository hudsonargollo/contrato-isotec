/**
 * Admin Layout Component Tests
 * Tests for the responsive admin layout with sidebar navigation
 * 
 * Requirements: 7.4, 7.6
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { AdminLayout } from '@/components/ui/admin-layout';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('AdminLayout', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/admin');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders admin layout with sidebar navigation', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    // Check if main navigation items are present
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Contratos')).toBeInTheDocument();
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Relatórios')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();

    // Check if content is rendered
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders header with user info when provided', () => {
    const userInfo = {
      name: 'João Silva',
      email: 'joao@isotec.com',
      role: 'Administrador'
    };

    render(
      <AdminLayout userInfo={userInfo}>
        <div>Test Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  it('renders default user info when not provided', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    // The default user info is only shown on sm+ screens, so we check for the avatar
    // which shows the first letter of the name
    const avatar = screen.getByText('A'); // First letter of "Administrador"
    expect(avatar).toBeInTheDocument();
    
    // The role "Admin" should be visible
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('shows mobile menu button on small screens', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    // Mobile menu button should be present (though hidden by CSS on large screens)
    const menuButtons = screen.getAllByRole('button');
    const mobileMenuButton = menuButtons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-menu')
    );
    
    expect(mobileMenuButton).toBeInTheDocument();
  });

  it('opens and closes mobile sidebar', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    // Find and click the mobile menu button
    const menuButtons = screen.getAllByRole('button');
    const mobileMenuButton = menuButtons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-menu')
    );
    
    expect(mobileMenuButton).toBeInTheDocument();
    
    if (mobileMenuButton) {
      fireEvent.click(mobileMenuButton);
      
      // After clicking, the sidebar should be open (overlay should be present)
      // Note: The overlay is only visible on mobile, so we check for the close button
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-x')
      );
      
      expect(closeButton).toBeInTheDocument();
    }
  });

  it('highlights active navigation item', () => {
    mockUsePathname.mockReturnValue('/admin/contracts');
    
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    // The Contratos link should have active styling
    const contractsButton = screen.getByRole('button', { name: /contratos/i });
    expect(contractsButton).toHaveClass('bg-solar-500/10', 'text-solar-400');
  });

  it('renders ISOTEC branding elements', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    // Check for ISOTEC logo
    expect(screen.getByAltText('ISOTEC - Painel Administrativo')).toBeInTheDocument();
    
    // Check for admin label
    expect(screen.getByText('Admin')).toBeInTheDocument();
    
    // Check for mascot (should be present but hidden on small screens)
    expect(screen.getByAltText('ISOTEC Mascot')).toBeInTheDocument();
  });

  it('includes quick action button in header', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('Novo Contrato')).toBeInTheDocument();
  });

  it('includes back to site link in sidebar', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('Voltar ao Site')).toBeInTheDocument();
  });

  it('applies consistent ISOTEC design system styling', () => {
    const { container } = render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    // Check for gradient background
    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer).toHaveClass('bg-gradient-to-br', 'from-neutral-900', 'via-neutral-800', 'to-ocean-900');
  });

  it('supports expandable navigation items', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    // Contratos should have expandable children
    const contractsButton = screen.getByRole('button', { name: /contratos/i });
    
    // Click to expand (preventDefault should be called, so it won't navigate)
    fireEvent.click(contractsButton);
    
    // Should show sub-items
    expect(screen.getByText('Todos os Contratos')).toBeInTheDocument();
    expect(screen.getByText('Aguardando Assinatura')).toBeInTheDocument();
    expect(screen.getByText('Assinados')).toBeInTheDocument();
  });
});