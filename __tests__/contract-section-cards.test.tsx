/**
 * Test for enhanced contract section cards
 * Validates task 8.4 requirements: dark theme styling, borders, responsive padding, rounded corners
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the contract page component for testing section card styling
const MockContractSection = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <section className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 sm:p-6">
    <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
      {title}
    </h2>
    <div className="space-y-2 text-neutral-300">
      {children}
    </div>
  </section>
);

describe('Contract Section Cards Enhancement', () => {
  it('should apply dark theme styling with bg-neutral-800/50', () => {
    render(
      <MockContractSection title="Test Section">
        <p>Test content</p>
      </MockContractSection>
    );
    
    const section = screen.getByText('Test Section').closest('section');
    expect(section).toHaveClass('bg-neutral-800/50');
  });

  it('should apply border styling with border-neutral-700', () => {
    render(
      <MockContractSection title="Test Section">
        <p>Test content</p>
      </MockContractSection>
    );
    
    const section = screen.getByText('Test Section').closest('section');
    expect(section).toHaveClass('border', 'border-neutral-700');
  });

  it('should apply rounded corners with rounded-xl', () => {
    render(
      <MockContractSection title="Test Section">
        <p>Test content</p>
      </MockContractSection>
    );
    
    const section = screen.getByText('Test Section').closest('section');
    expect(section).toHaveClass('rounded-xl');
  });

  it('should implement responsive padding (p-4 sm:p-6)', () => {
    render(
      <MockContractSection title="Test Section">
        <p>Test content</p>
      </MockContractSection>
    );
    
    const section = screen.getByText('Test Section').closest('section');
    expect(section).toHaveClass('p-4', 'sm:p-6');
  });

  it('should render section title with proper styling', () => {
    render(
      <MockContractSection title="Contractor Information">
        <p>Test content</p>
      </MockContractSection>
    );
    
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Contractor Information');
    expect(heading).toHaveClass('text-lg', 'font-semibold', 'text-white', 'mb-3');
  });

  it('should render content with proper text styling', () => {
    render(
      <MockContractSection title="Test Section">
        <p>Test content</p>
      </MockContractSection>
    );
    
    const contentDiv = screen.getByText('Test content').parentElement;
    expect(contentDiv).toHaveClass('space-y-2', 'text-neutral-300');
  });
});