/**
 * Admin Dashboard Page Tests
 * Tests for the admin dashboard page functionality
 * 
 * Requirements: 7.2, 7.6
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import AdminDashboard from '@/app/admin/page';

// Mock the hooks
jest.mock('@/lib/hooks/use-dashboard-stats', () => ({
  useDashboardStats: jest.fn()
}));

jest.mock('@/lib/hooks/use-dashboard-activity', () => ({
  useDashboardActivity: jest.fn()
}));

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock the AdminLayout component to avoid navigation issues
jest.mock('@/components/ui/admin-layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-layout">{children}</div>
  )
}));

// Mock the AdminAuthWrapper to bypass authentication
jest.mock('@/components/ui/admin-auth-wrapper', () => ({
  AdminAuthWrapper: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-auth-wrapper">{children}</div>
  )
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null })
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        }))
      }))
    }))
  }))
}));

describe('AdminDashboard', () => {
  const mockUseDashboardStats = require('@/lib/hooks/use-dashboard-stats').useDashboardStats;
  const mockUseDashboardActivity = require('@/lib/hooks/use-dashboard-activity').useDashboardActivity;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should render dashboard with loading states', () => {
    // Mock loading states
    mockUseDashboardStats.mockReturnValue({
      stats: null,
      loading: true,
      error: null,
      refetch: jest.fn()
    });

    mockUseDashboardActivity.mockReturnValue({
      activities: [],
      loading: true,
      error: null,
      refetch: jest.fn()
    });

    render(<AdminDashboard />);

    // Check if main elements are present
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Visão geral do sistema de contratos')).toBeInTheDocument();
    expect(screen.getByText('Atualizar')).toBeInTheDocument();

    // Check if stat cards are present
    expect(screen.getByText('Total de Contratos')).toBeInTheDocument();
    expect(screen.getByText('Contratos Assinados')).toBeInTheDocument();
    expect(screen.getByText('Aguardando Assinatura')).toBeInTheDocument();
    expect(screen.getByText('Clientes Ativos')).toBeInTheDocument();

    // Check if quick actions are present
    expect(screen.getByText('Ações Rápidas')).toBeInTheDocument();
    expect(screen.getByText('Criar Novo Contrato')).toBeInTheDocument();
    expect(screen.getByText('Ver Todos os Contratos')).toBeInTheDocument();

    // Check if recent activity section is present
    expect(screen.getByText('Atividade Recente')).toBeInTheDocument();
  });

  it('should render dashboard with statistics data', async () => {
    // Mock data states
    mockUseDashboardStats.mockReturnValue({
      stats: {
        totalContracts: 25,
        signedContracts: 18,
        pendingSignature: 7,
        activeClients: 15
      },
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    mockUseDashboardActivity.mockReturnValue({
      activities: [],
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<AdminDashboard />);

    // Wait for data to be displayed
    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  it('should render dashboard with activity data', async () => {
    // Mock data states
    mockUseDashboardStats.mockReturnValue({
      stats: {
        totalContracts: 0,
        signedContracts: 0,
        pendingSignature: 0,
        activeClients: 0
      },
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    mockUseDashboardActivity.mockReturnValue({
      activities: [
        {
          id: '1',
          title: 'Novo contrato criado',
          description: 'Contrato para João Silva',
          contractUuid: 'test-uuid-123',
          contractorName: 'João Silva',
          status: 'pending_signature',
          contractValue: 25000,
          timestamp: '2024-01-15T10:30:00Z'
        }
      ],
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<AdminDashboard />);

    // Wait for activity to be displayed
    await waitFor(() => {
      expect(screen.getByText('Novo contrato criado')).toBeInTheDocument();
      expect(screen.getByText('Contrato para João Silva')).toBeInTheDocument();
      expect(screen.getByText('Ver contrato')).toBeInTheDocument();
    });
  });

  it('should render error states', () => {
    // Mock error states
    mockUseDashboardStats.mockReturnValue({
      stats: null,
      loading: false,
      error: 'Failed to fetch statistics',
      refetch: jest.fn()
    });

    mockUseDashboardActivity.mockReturnValue({
      activities: [],
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<AdminDashboard />);

    // Check if error message is displayed
    expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch statistics')).toBeInTheDocument();
  });

  it('should render empty state when no activities', () => {
    // Mock empty states
    mockUseDashboardStats.mockReturnValue({
      stats: {
        totalContracts: 0,
        signedContracts: 0,
        pendingSignature: 0,
        activeClients: 0
      },
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    mockUseDashboardActivity.mockReturnValue({
      activities: [],
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<AdminDashboard />);

    // Check if empty state is displayed
    expect(screen.getByText('Nenhuma atividade recente')).toBeInTheDocument();
    expect(screen.getByText('Crie seu primeiro contrato para começar')).toBeInTheDocument();
    expect(screen.getByText('Criar Primeiro Contrato')).toBeInTheDocument();
  });

  it('should have correct navigation links', () => {
    // Mock data states
    mockUseDashboardStats.mockReturnValue({
      stats: null,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    mockUseDashboardActivity.mockReturnValue({
      activities: [],
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<AdminDashboard />);

    // Check navigation links
    const createContractLink = screen.getByText('Criar Novo Contrato').closest('a');
    expect(createContractLink).toHaveAttribute('href', '/wizard');

    const viewContractsLink = screen.getByText('Ver Todos os Contratos').closest('a');
    expect(viewContractsLink).toHaveAttribute('href', '/admin/contracts');

    const pendingLink = screen.getByText('Pendentes').closest('a');
    expect(pendingLink).toHaveAttribute('href', '/admin/contracts?status=pending_signature');
  });
});