/**
 * Contract View Header Tests
 * Tests for the redesigned contract view header (Task 8.1)
 */

import { render, screen } from '@testing-library/react';

// Mock Next.js components
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, className, priority, ...props }: any) => (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      data-priority={priority}
      {...props}
    />
  ),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 1,
              uuid: 'test-uuid',
              contractor_name: 'João Silva',
              contractor_cpf: '12345678901',
              contractor_email: 'joao@example.com',
              contractor_phone: '11999999999',
              address_cep: '01234567',
              address_street: 'Rua Teste',
              address_number: '123',
              address_neighborhood: 'Centro',
              address_city: 'São Paulo',
              address_state: 'SP',
              project_kwp: 5.5,
              contract_value: '25000.00',
              payment_method: 'pix',
              status: 'pending_signature',
              contract_items: [],
              services: [],
            },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

// Mock validation functions
jest.mock('@/lib/validation/cpf', () => ({
  formatCPF: (cpf: string) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
}));

jest.mock('@/lib/validation/cep', () => ({
  formatCEP: (cep: string) => cep.replace(/(\d{5})(\d{3})/, '$1-$2'),
}));

jest.mock('@/lib/validation/currency', () => ({
  formatCurrency: (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
}));

jest.mock('@/lib/services/googlemaps', () => ({
  formatCoordinates: (lat: number, lng: number) => `${lat}, ${lng}`,
}));

jest.mock('@/components/contract/EmailSignature', () => ({
  EmailSignature: ({ contractId, contractorEmail }: any) => (
    <div data-testid="email-signature">
      Email Signature Component - Contract: {contractId}, Email: {contractorEmail}
    </div>
  ),
}));

// Import the component after mocks
import ContractPage from '@/app/contracts/[uuid]/page';

describe('Contract View Header', () => {
  const mockParams = Promise.resolve({ uuid: 'test-uuid' });

  it('renders header with dark theme background', async () => {
    const { container } = render(await ContractPage({ params: mockParams }));
    
    const header = container.querySelector('header');
    expect(header).toHaveClass('bg-neutral-900');
    expect(header).toHaveClass('border-b');
    expect(header).toHaveClass('border-neutral-700');
  });

  it('displays ISOTEC logo with proper sizing and responsive classes', async () => {
    render(await ContractPage({ params: mockParams }));
    
    const logo = screen.getByAltText('ISOTEC Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/isotec-logo.webp');
    expect(logo).toHaveClass('h-8', 'sm:h-10', 'lg:h-12', 'w-auto');
    expect(logo).toHaveAttribute('data-priority', 'true');
  });

  it('has responsive padding on header container', async () => {
    const { container } = render(await ContractPage({ params: mockParams }));
    
    const headerContainer = container.querySelector('header > div');
    expect(headerContainer).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
    expect(headerContainer).toHaveClass('py-4', 'sm:py-6');
  });

  it('displays contract title with responsive text sizing', async () => {
    render(await ContractPage({ params: mockParams }));
    
    const title = screen.getByText('Contrato de Instalação Fotovoltaica');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('text-lg', 'sm:text-xl', 'lg:text-2xl');
    expect(title).toHaveClass('font-semibold', 'text-white');
  });

  it('includes visual separator between logo and title', async () => {
    const { container } = render(await ContractPage({ params: mockParams }));
    
    const separator = container.querySelector('.h-6.sm\\:h-8.w-px.bg-neutral-700');
    expect(separator).toBeInTheDocument();
  });

  it('uses consistent neutral color system throughout', async () => {
    const { container } = render(await ContractPage({ params: mockParams }));
    
    // Check main background
    const mainContainer = container.querySelector('.min-h-screen');
    expect(mainContainer).toHaveClass('bg-gradient-to-br', 'from-neutral-900', 'via-neutral-800', 'to-neutral-900');
    
    // Check sections use neutral colors with new compact styling
    const sections = container.querySelectorAll('section');
    sections.forEach(section => {
      expect(section).toHaveClass('bg-neutral-800/50', 'border-neutral-700');
      // Check for new rounded-xl styling instead of rounded-lg
      expect(section).toHaveClass('rounded-xl');
    });
  });

  it('uses ISOTEC brand colors for icons and accents', async () => {
    const { container } = render(await ContractPage({ params: mockParams }));
    
    // Check that solar color is used for section icons
    const sectionHeaders = container.querySelectorAll('h2');
    expect(sectionHeaders.length).toBeGreaterThan(0);
    
    // The icons should use text-solar-500 class
    const icons = container.querySelectorAll('.text-solar-500');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('maintains responsive layout structure', async () => {
    const { container } = render(await ContractPage({ params: mockParams }));
    
    const headerFlex = container.querySelector('header .flex.items-center.justify-between');
    expect(headerFlex).toBeInTheDocument();
    
    const logoTitleGroup = container.querySelector('.flex.items-center.gap-3.sm\\:gap-4');
    expect(logoTitleGroup).toBeInTheDocument();
  });

  it('implements optimized customer information grid layout', async () => {
    const { container } = render(await ContractPage({ params: mockParams }));
    
    // Check for the main critical information grid
    const criticalGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    expect(criticalGrid).toBeInTheDocument();
    
    // Check for compact spacing (gap-3 instead of gap-6)
    expect(criticalGrid).toHaveClass('gap-3');
    
    // Check for secondary information grid
    const secondaryGrid = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2');
    expect(secondaryGrid).toBeInTheDocument();
  });

  it('uses compact card styling with reduced padding', async () => {
    const { container } = render(await ContractPage({ params: mockParams }));
    
    // Check sections use compact padding (p-4 instead of p-6)
    const sections = container.querySelectorAll('section');
    sections.forEach(section => {
      expect(section).toHaveClass('p-4');
      expect(section).not.toHaveClass('p-6');
    });
  });

  it('prioritizes critical information at the top', async () => {
    render(await ContractPage({ params: mockParams }));
    
    // Check that contractor information appears first
    const contractorSection = screen.getByText('Identificação do Contratante').closest('section');
    expect(contractorSection).toBeInTheDocument();
    
    // Check that project specifications and financial info are also in the top grid
    const projectSection = screen.getByText('Especificações do Projeto').closest('section');
    const financialSection = screen.getByText('Informações Financeiras').closest('section');
    
    expect(projectSection).toBeInTheDocument();
    expect(financialSection).toBeInTheDocument();
    
    // These should be in the same grid container as contractor info
    const criticalGrid = contractorSection?.parentElement;
    expect(criticalGrid).toBe(projectSection?.parentElement);
    expect(criticalGrid).toBe(financialSection?.parentElement);
    
    // Verify the grid has the correct classes
    expect(criticalGrid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
  });

  it('reduces overall spacing to fit content in viewport', async () => {
    const { container } = render(await ContractPage({ params: mockParams }));
    
    // Check main container uses reduced spacing (space-y-4 instead of space-y-6)
    const mainContainer = container.querySelector('.space-y-4');
    expect(mainContainer).toBeInTheDocument();
    
    // Check main content uses reduced padding (py-4 sm:py-6 instead of py-6 sm:py-8)
    const mainContent = container.querySelector('main');
    expect(mainContent).toHaveClass('py-4', 'sm:py-6');
    
    // Check footer uses reduced margin (mt-8 instead of mt-12)
    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('mt-8');
    expect(footer).not.toHaveClass('mt-12');
  });
});