/**
 * Contract Data Grid Tests
 * Tests for the responsive contract data grid implementation
 * Validates Requirements 3.3, 3.5, 4.5
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Grid, GridItem } from '@/components/ui/grid';

// Mock contract data for testing
const mockContractData = {
  contractor_name: 'João Silva',
  contractor_cpf: '12345678901',
  contractor_email: 'joao@example.com',
  contractor_phone: '(11) 99999-9999',
  project_kwp: 5.5,
  contract_value: '25000.00',
  payment_method: 'pix',
  address_cep: '01234567',
  address_street: 'Rua das Flores',
  address_number: '123',
  address_neighborhood: 'Centro',
  address_city: 'São Paulo',
  address_state: 'SP',
  location_latitude: '-23.5505',
  location_longitude: '-46.6333',
};

describe('Contract Data Grid', () => {
  describe('Critical Customer Information Grid', () => {
    it('renders with responsive grid configuration', () => {
      const { container } = render(
        <Grid 
          columns={{ mobile: 1, tablet: 2, desktop: 3 }}
          gap="sm"
          className="mb-4"
        >
          <section data-testid="contractor-info">
            <h2>Identificação do Contratante</h2>
            <div>
              <p>Nome: {mockContractData.contractor_name}</p>
              <p>CPF: {mockContractData.contractor_cpf}</p>
            </div>
          </section>
          
          <section data-testid="project-specs">
            <h2>Especificações do Projeto</h2>
            <div>
              <p>Potência: {mockContractData.project_kwp} kWp</p>
            </div>
          </section>
          
          <section data-testid="financial-info">
            <h2>Informações Financeiras</h2>
            <div>
              <p>Valor: R$ {mockContractData.contract_value}</p>
            </div>
          </section>
        </Grid>
      );

      const gridElement = container.firstChild as HTMLElement;
      
      // Verify responsive grid classes
      expect(gridElement).toHaveClass('grid');
      expect(gridElement).toHaveClass('grid-cols-1'); // Mobile: single column
      expect(gridElement).toHaveClass('md:grid-cols-2'); // Tablet: two columns
      expect(gridElement).toHaveClass('lg:grid-cols-3'); // Desktop: three columns
      
      // Verify consistent gap spacing
      expect(gridElement).toHaveClass('gap-2'); // sm gap
      
      // Verify additional styling
      expect(gridElement).toHaveClass('mb-4');
    });

    it('displays all critical sections', () => {
      render(
        <Grid 
          columns={{ mobile: 1, tablet: 2, desktop: 3 }}
          gap="sm"
        >
          <section data-testid="contractor-info">
            <h2>Identificação do Contratante</h2>
          </section>
          
          <section data-testid="project-specs">
            <h2>Especificações do Projeto</h2>
          </section>
          
          <section data-testid="financial-info">
            <h2>Informações Financeiras</h2>
          </section>
        </Grid>
      );

      expect(screen.getByTestId('contractor-info')).toBeInTheDocument();
      expect(screen.getByTestId('project-specs')).toBeInTheDocument();
      expect(screen.getByTestId('financial-info')).toBeInTheDocument();
    });
  });

  describe('Address Information Grid', () => {
    it('renders with 4-column desktop layout', () => {
      const { container } = render(
        <Grid 
          columns={{ mobile: 1, tablet: 2, desktop: 4 }}
          gap="sm"
          className="text-neutral-300"
        >
          <GridItem>
            <p>CEP: {mockContractData.address_cep}</p>
          </GridItem>
          <GridItem span={2}>
            <p>Endereço: {mockContractData.address_street}, {mockContractData.address_number}</p>
          </GridItem>
          <GridItem>
            <p>Bairro: {mockContractData.address_neighborhood}</p>
          </GridItem>
        </Grid>
      );

      const gridElement = container.firstChild as HTMLElement;
      
      // Verify responsive grid classes for address layout
      expect(gridElement).toHaveClass('grid');
      expect(gridElement).toHaveClass('grid-cols-1'); // Mobile: single column
      expect(gridElement).toHaveClass('md:grid-cols-2'); // Tablet: two columns
      expect(gridElement).toHaveClass('lg:grid-cols-4'); // Desktop: four columns
      
      // Verify gap spacing
      expect(gridElement).toHaveClass('gap-2'); // sm gap
      
      // Verify text styling
      expect(gridElement).toHaveClass('text-neutral-300');
    });

    it('handles column spans correctly', () => {
      const { container } = render(
        <Grid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="sm">
          <GridItem data-testid="cep-item">
            <p>CEP</p>
          </GridItem>
          <GridItem span={2} data-testid="address-item">
            <p>Endereço</p>
          </GridItem>
          <GridItem data-testid="neighborhood-item">
            <p>Bairro</p>
          </GridItem>
        </Grid>
      );

      const addressItem = screen.getByTestId('address-item');
      expect(addressItem).toHaveClass('col-span-2');
      
      const cepItem = screen.getByTestId('cep-item');
      expect(cepItem).not.toHaveClass('col-span-2');
      
      const neighborhoodItem = screen.getByTestId('neighborhood-item');
      expect(neighborhoodItem).not.toHaveClass('col-span-2');
    });
  });

  describe('Secondary Information Grid', () => {
    it('renders with 2-column desktop layout', () => {
      const { container } = render(
        <Grid 
          columns={{ mobile: 1, tablet: 1, desktop: 2 }}
          gap="sm"
        >
          <section data-testid="equipment-list">
            <h2>Lista de Equipamentos</h2>
          </section>
          
          <section data-testid="service-scope">
            <h2>Escopo de Serviços</h2>
          </section>
        </Grid>
      );

      const gridElement = container.firstChild as HTMLElement;
      
      // Verify responsive grid classes for secondary layout
      expect(gridElement).toHaveClass('grid');
      expect(gridElement).toHaveClass('grid-cols-1'); // Mobile: single column
      expect(gridElement).toHaveClass('md:grid-cols-1'); // Tablet: single column
      expect(gridElement).toHaveClass('lg:grid-cols-2'); // Desktop: two columns
      
      // Verify gap spacing
      expect(gridElement).toHaveClass('gap-2'); // sm gap
    });

    it('displays equipment and service sections', () => {
      render(
        <Grid columns={{ mobile: 1, tablet: 1, desktop: 2 }} gap="sm">
          <section data-testid="equipment-list">
            <h2>Lista de Equipamentos</h2>
          </section>
          
          <section data-testid="service-scope">
            <h2>Escopo de Serviços</h2>
          </section>
        </Grid>
      );

      expect(screen.getByTestId('equipment-list')).toBeInTheDocument();
      expect(screen.getByTestId('service-scope')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('maintains consistent gap spacing across all grids', () => {
      const grids = [
        { columns: { mobile: 1, tablet: 2, desktop: 3 }, testId: 'critical-grid' },
        { columns: { mobile: 1, tablet: 2, desktop: 4 }, testId: 'address-grid' },
        { columns: { mobile: 1, tablet: 1, desktop: 2 }, testId: 'secondary-grid' },
      ];

      grids.forEach(({ columns, testId }) => {
        const { container } = render(
          <Grid 
            columns={columns}
            gap="sm"
            data-testid={testId}
          >
            <div>Test content</div>
          </Grid>
        );

        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass('gap-2'); // sm gap = gap-2
      });
    });

    it('applies mobile-first responsive design', () => {
      const { container } = render(
        <Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="sm">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </Grid>
      );

      const gridElement = container.firstChild as HTMLElement;
      
      // Mobile-first: base class is mobile
      expect(gridElement).toHaveClass('grid-cols-1');
      
      // Tablet: md prefix
      expect(gridElement).toHaveClass('md:grid-cols-2');
      
      // Desktop: lg prefix
      expect(gridElement).toHaveClass('lg:grid-cols-3');
    });

    it('handles edge cases gracefully', () => {
      // Test with no children
      const { container: emptyContainer } = render(
        <Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="sm" />
      );
      expect(emptyContainer.firstChild).toHaveClass('grid');

      // Test with single child
      const { container: singleContainer } = render(
        <Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="sm">
          <div>Single Item</div>
        </Grid>
      );
      expect(singleContainer.firstChild).toHaveClass('grid');
      expect(screen.getByText('Single Item')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('supports ARIA attributes for grid structure', () => {
      const { container } = render(
        <Grid 
          columns={{ mobile: 1, tablet: 2, desktop: 3 }}
          gap="sm"
          role="grid"
          aria-label="Contract information grid"
        >
          <section role="gridcell">
            <h2>Section 1</h2>
          </section>
          <section role="gridcell">
            <h2>Section 2</h2>
          </section>
        </Grid>
      );

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveAttribute('role', 'grid');
      expect(gridElement).toHaveAttribute('aria-label', 'Contract information grid');
    });

    it('maintains semantic HTML structure', () => {
      render(
        <Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="sm">
          <section>
            <h2>Contractor Information</h2>
            <div>
              <p>Name: John Doe</p>
            </div>
          </section>
        </Grid>
      );

      // Verify semantic elements are preserved
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByText('Contractor Information')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders efficiently with multiple grid sections', () => {
      const startTime = performance.now();
      
      render(
        <>
          <Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="sm">
            {Array.from({ length: 3 }, (_, i) => (
              <section key={i}>Section {i + 1}</section>
            ))}
          </Grid>
          
          <Grid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="sm">
            {Array.from({ length: 6 }, (_, i) => (
              <GridItem key={i} span={i === 1 ? 2 : undefined}>
                Item {i + 1}
              </GridItem>
            ))}
          </Grid>
          
          <Grid columns={{ mobile: 1, tablet: 1, desktop: 2 }} gap="sm">
            {Array.from({ length: 2 }, (_, i) => (
              <section key={i}>Secondary Section {i + 1}</section>
            ))}
          </Grid>
        </>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render multiple grids efficiently
      expect(renderTime).toBeLessThan(50);
    });
  });
});

describe('Contract Data Grid Integration', () => {
  it('matches the expected layout structure from requirements', () => {
    // Test the complete contract data grid structure as implemented
    const { container } = render(
      <div className="space-y-4">
        {/* Critical Customer Information Grid */}
        <Grid 
          columns={{ mobile: 1, tablet: 2, desktop: 3 }}
          gap="sm"
          className="mb-4"
          data-testid="critical-info-grid"
        >
          <section>Contractor Info</section>
          <section>Project Specs</section>
          <section>Financial Info</section>
        </Grid>

        {/* Address Information */}
        <section>
          <Grid 
            columns={{ mobile: 1, tablet: 2, desktop: 4 }}
            gap="sm"
            className="text-neutral-300"
            data-testid="address-grid"
          >
            <GridItem>CEP</GridItem>
            <GridItem span={2}>Address</GridItem>
            <GridItem>Neighborhood</GridItem>
          </Grid>
        </section>

        {/* Secondary Information Grid */}
        <Grid 
          columns={{ mobile: 1, tablet: 1, desktop: 2 }}
          gap="sm"
          data-testid="secondary-grid"
        >
          <section>Equipment List</section>
          <section>Service Scope</section>
        </Grid>
      </div>
    );

    // Verify all grids are present
    expect(screen.getByTestId('critical-info-grid')).toBeInTheDocument();
    expect(screen.getByTestId('address-grid')).toBeInTheDocument();
    expect(screen.getByTestId('secondary-grid')).toBeInTheDocument();

    // Verify responsive behavior is consistent
    const grids = container.querySelectorAll('[data-testid$="-grid"]');
    grids.forEach(grid => {
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('gap-2'); // sm gap
    });
  });

  it('validates requirements 3.3, 3.5, and 4.5', () => {
    const { container } = render(
      <Grid 
        columns={{ mobile: 1, tablet: 2, desktop: 3 }}
        gap="sm"
      >
        <section>Section 1</section>
        <section>Section 2</section>
        <section>Section 3</section>
      </Grid>
    );

    const gridElement = container.firstChild as HTMLElement;
    
    // Requirement 3.3: Mobile responsiveness - single column on mobile
    expect(gridElement).toHaveClass('grid-cols-1');
    
    // Requirement 3.5: Tablet optimization - two columns on tablet
    expect(gridElement).toHaveClass('md:grid-cols-2');
    
    // Requirement 4.5: Desktop layout optimization - three columns on desktop
    expect(gridElement).toHaveClass('lg:grid-cols-3');
    
    // Consistent gap spacing across all breakpoints
    expect(gridElement).toHaveClass('gap-2');
  });
});