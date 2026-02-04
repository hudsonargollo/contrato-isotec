/**
 * Unit tests for ContractPDF component
 * 
 * Tests the PDF generation with dynamic equipment and services tables
 * Requirements: 8.3, 8.5
 */

import React from 'react';

// Mock @react-pdf/renderer to avoid Jest parsing issues
jest.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: any) => <div data-testid="pdf-document">{children}</div>,
  Page: ({ children }: any) => <div data-testid="pdf-page">{children}</div>,
  Text: ({ children }: any) => <span data-testid="pdf-text">{children}</span>,
  View: ({ children }: any) => <div data-testid="pdf-view">{children}</div>,
  Image: ({ src }: any) => <img data-testid="pdf-image" src={src} alt="" />,
  StyleSheet: {
    create: (styles: any) => styles
  },
  Font: {
    register: jest.fn()
  }
}));

import { ContractPDF } from '@/lib/pdf/ContractPDF';
import { render, screen } from '@testing-library/react';

describe('ContractPDF', () => {
  const mockContractData = {
    // Contractor Information
    contractorName: 'João Silva',
    contractorCPF: '12345678901',
    contractorEmail: 'joao@example.com',
    contractorPhone: '(11) 98765-4321',

    // Installation Address
    addressCEP: '01310100',
    addressStreet: 'Avenida Paulista',
    addressNumber: '1000',
    addressComplement: 'Apto 101',
    addressNeighborhood: 'Bela Vista',
    addressCity: 'São Paulo',
    addressState: 'SP',

    // Geographic Location
    locationLatitude: -23.561414,
    locationLongitude: -46.656139,

    // Project Specifications
    projectKWp: 10.5,
    installationDate: new Date('2024-06-15'),

    // Equipment Items
    items: [
      { itemName: 'Painel Solar 550W', quantity: 20, unit: 'un' },
      { itemName: 'Inversor 10kW', quantity: 1, unit: 'un' },
      { itemName: 'String Box', quantity: 2, unit: 'un' },
      { itemName: 'Cabo Solar 6mm', quantity: 100, unit: 'm' }
    ],

    // Services
    services: [
      { description: 'Projeto elétrico e estrutural', included: true },
      { description: 'Instalação completa do sistema', included: true },
      { description: 'Homologação junto à concessionária', included: true },
      { description: 'Monitoramento remoto', included: true },
      { description: 'Manutenção preventiva anual', included: false },
      { description: 'Seguro contra danos', included: false }
    ],

    // Financial Information
    contractValue: 52500.00,
    paymentMethod: 'pix' as const,

    // Metadata
    createdAt: new Date('2024-01-15')
  };

  it('should render PDF document structure', () => {
    render(<ContractPDF data={mockContractData} />);
    
    expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
    expect(screen.getByTestId('pdf-page')).toBeInTheDocument();
  });

  it('should include contractor information', () => {
    render(<ContractPDF data={mockContractData} />);
    
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('123.456.789-01')).toBeInTheDocument();
  });

  it('should include equipment table with all items', () => {
    render(<ContractPDF data={mockContractData} />);
    
    expect(screen.getByText('Equipamentos')).toBeInTheDocument();
    expect(screen.getByText('Painel Solar 550W')).toBeInTheDocument();
    expect(screen.getByText('Inversor 10kW')).toBeInTheDocument();
    expect(screen.getByText('String Box')).toBeInTheDocument();
    expect(screen.getByText('Cabo Solar 6mm')).toBeInTheDocument();
  });

  it('should include services table with descriptions', () => {
    render(<ContractPDF data={mockContractData} />);
    
    expect(screen.getByText('Serviços Inclusos')).toBeInTheDocument();
    expect(screen.getByText('Projeto elétrico e estrutural')).toBeInTheDocument();
    expect(screen.getByText('Instalação completa do sistema')).toBeInTheDocument();
    expect(screen.getByText('Manutenção preventiva anual')).toBeInTheDocument();
  });

  it('should handle empty equipment list', () => {
    const dataWithoutItems = {
      ...mockContractData,
      items: []
    };
    
    render(<ContractPDF data={dataWithoutItems} />);
    expect(screen.getByText('Nenhum equipamento especificado')).toBeInTheDocument();
  });

  it('should handle empty services list', () => {
    const dataWithoutServices = {
      ...mockContractData,
      services: []
    };
    
    render(<ContractPDF data={dataWithoutServices} />);
    expect(screen.getByText('Nenhum serviço especificado')).toBeInTheDocument();
  });

  it('should render with optional fields missing', () => {
    const minimalData = {
      contractorName: 'Maria Santos',
      contractorCPF: '98765432100',
      addressCEP: '01310100',
      addressStreet: 'Avenida Paulista',
      addressNumber: '2000',
      addressNeighborhood: 'Bela Vista',
      addressCity: 'São Paulo',
      addressState: 'SP',
      projectKWp: 5.0,
      items: [],
      services: [],
      contractValue: 25000.00,
      paymentMethod: 'cash' as const,
      createdAt: new Date()
    };
    
    render(<ContractPDF data={minimalData} />);
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
  });

  it('should display equipment quantities and units', () => {
    render(<ContractPDF data={mockContractData} />);
    
    // Check that quantities are displayed
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should display service inclusion status with checkmarks', () => {
    render(<ContractPDF data={mockContractData} />);
    
    // The component uses ✓ and ✗ symbols
    const texts = screen.getAllByTestId('pdf-text');
    const hasCheckmarks = texts.some(el => 
      el.textContent === '✓' || el.textContent === '✗'
    );
    expect(hasCheckmarks).toBe(true);
  });

  describe('Signature Verification Section', () => {
    it('should not display signature section for unsigned contracts', () => {
      render(<ContractPDF data={mockContractData} />);
      
      expect(screen.queryByText('Verificação de Assinatura Digital')).not.toBeInTheDocument();
    });

    it('should display signature section for signed contracts with GOV.BR', () => {
      const signedData = {
        ...mockContractData,
        signatureData: {
          contractHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
          signedAt: new Date('2024-01-20T14:30:00'),
          signatureMethod: 'govbr' as const,
          signerIdentifier: 'GOV.BR-123456789'
        }
      };
      
      render(<ContractPDF data={signedData} />);
      
      expect(screen.getByText('Verificação de Assinatura Digital')).toBeInTheDocument();
      expect(screen.getByText('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2')).toBeInTheDocument();
      expect(screen.getByText('GOV.BR (Assinatura Avançada)')).toBeInTheDocument();
      expect(screen.getByText('GOV.BR-123456789')).toBeInTheDocument();
    });

    it('should display signature section for signed contracts with email', () => {
      const signedData = {
        ...mockContractData,
        signatureData: {
          contractHash: 'f2e1d0c9b8a7z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1',
          signedAt: new Date('2024-01-21T10:15:00'),
          signatureMethod: 'email' as const,
          signerIdentifier: 'joao@example.com'
        }
      };
      
      render(<ContractPDF data={signedData} />);
      
      expect(screen.getByText('Verificação de Assinatura Digital')).toBeInTheDocument();
      expect(screen.getByText('f2e1d0c9b8a7z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1')).toBeInTheDocument();
      expect(screen.getByText('E-mail (Assinatura Admitida)')).toBeInTheDocument();
      // Email appears twice: once in contractor info, once in signature section
      expect(screen.getAllByText('joao@example.com').length).toBeGreaterThanOrEqual(1);
    });

    it('should display signature timestamp in Brazilian format', () => {
      const signedData = {
        ...mockContractData,
        signatureData: {
          contractHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
          signedAt: new Date('2024-01-20T14:30:00'),
          signatureMethod: 'govbr' as const
        }
      };
      
      render(<ContractPDF data={signedData} />);
      
      // Check that a date/time is displayed (format may vary by locale)
      expect(screen.getByText(/20\/01\/2024/)).toBeInTheDocument();
    });

    it('should handle signature without signer identifier', () => {
      const signedData = {
        ...mockContractData,
        signatureData: {
          contractHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
          signedAt: new Date('2024-01-20T14:30:00'),
          signatureMethod: 'email' as const
          // No signerIdentifier
        }
      };
      
      render(<ContractPDF data={signedData} />);
      
      expect(screen.getByText('Verificação de Assinatura Digital')).toBeInTheDocument();
      expect(screen.queryByText('Identificador do Signatário:')).not.toBeInTheDocument();
    });
  });
});
