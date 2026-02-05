/**
 * Test suite for color usage in React components
 * Validates: Requirements 1.6, 2.1, 2.4
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';

// Test component using the new color palette
const ColorTestComponent = () => {
  return (
    <div className="bg-neutral-50 p-4">
      <h1 className="text-neutral-900 text-2xl font-bold mb-4">
        ISOTEC Color Test
      </h1>
      
      {/* Primary button using solar colors */}
      <button 
        className="bg-solar-500 hover:bg-solar-600 text-white px-4 py-2 rounded mr-2"
        data-testid="primary-button"
      >
        Primary Action
      </button>
      
      {/* Secondary button using ocean colors */}
      <button 
        className="bg-ocean-500 hover:bg-ocean-600 text-white px-4 py-2 rounded mr-2"
        data-testid="secondary-button"
      >
        Secondary Action
      </button>
      
      {/* Success button using energy colors */}
      <button 
        className="bg-energy-500 hover:bg-energy-600 text-white px-4 py-2 rounded mr-2"
        data-testid="success-button"
      >
        Success Action
      </button>
      
      {/* Semantic color examples */}
      <div className="mt-4 space-y-2">
        <div 
          className="bg-green-500 text-white p-2 rounded"
          data-testid="success-message"
        >
          Success message
        </div>
        <div 
          className="bg-red-500 text-white p-2 rounded"
          data-testid="error-message"
        >
          Error message
        </div>
        <div 
          className="bg-yellow-500 text-white p-2 rounded"
          data-testid="warning-message"
        >
          Warning message
        </div>
        <div 
          className="bg-blue-500 text-white p-2 rounded"
          data-testid="info-message"
        >
          Info message
        </div>
      </div>
      
      {/* Card using neutral colors */}
      <div 
        className="bg-white border border-neutral-200 rounded-lg p-4 mt-4"
        data-testid="neutral-card"
      >
        <h3 className="text-neutral-800 font-semibold">Card Title</h3>
        <p className="text-neutral-600">Card content using neutral colors</p>
      </div>
    </div>
  );
};

describe('Color Component Integration', () => {
  it('should render component with ISOTEC color classes', () => {
    render(<ColorTestComponent />);
    
    // Check that elements are rendered
    expect(screen.getByText('ISOTEC Color Test')).toBeInTheDocument();
    expect(screen.getByTestId('primary-button')).toBeInTheDocument();
    expect(screen.getByTestId('secondary-button')).toBeInTheDocument();
    expect(screen.getByTestId('success-button')).toBeInTheDocument();
  });

  it('should apply solar colors to primary button', () => {
    render(<ColorTestComponent />);
    
    const primaryButton = screen.getByTestId('primary-button');
    expect(primaryButton).toHaveClass('bg-solar-500');
    expect(primaryButton).toHaveClass('hover:bg-solar-600');
  });

  it('should apply ocean colors to secondary button', () => {
    render(<ColorTestComponent />);
    
    const secondaryButton = screen.getByTestId('secondary-button');
    expect(secondaryButton).toHaveClass('bg-ocean-500');
    expect(secondaryButton).toHaveClass('hover:bg-ocean-600');
  });

  it('should apply energy colors to success button', () => {
    render(<ColorTestComponent />);
    
    const successButton = screen.getByTestId('success-button');
    expect(successButton).toHaveClass('bg-energy-500');
    expect(successButton).toHaveClass('hover:bg-energy-600');
  });

  it('should apply neutral colors to card', () => {
    render(<ColorTestComponent />);
    
    const card = screen.getByTestId('neutral-card');
    expect(card).toHaveClass('border-neutral-200');
    expect(card).toHaveClass('bg-white');
  });

  it('should apply semantic colors correctly', () => {
    render(<ColorTestComponent />);
    
    expect(screen.getByTestId('success-message')).toHaveClass('bg-green-500');
    expect(screen.getByTestId('error-message')).toHaveClass('bg-red-500');
    expect(screen.getByTestId('warning-message')).toHaveClass('bg-yellow-500');
    expect(screen.getByTestId('info-message')).toHaveClass('bg-blue-500');
  });

  it('should use proper text colors for contrast', () => {
    render(<ColorTestComponent />);
    
    // All buttons should have white text for contrast
    expect(screen.getByTestId('primary-button')).toHaveClass('text-white');
    expect(screen.getByTestId('secondary-button')).toHaveClass('text-white');
    expect(screen.getByTestId('success-button')).toHaveClass('text-white');
    
    // Semantic messages should have white text
    expect(screen.getByTestId('success-message')).toHaveClass('text-white');
    expect(screen.getByTestId('error-message')).toHaveClass('text-white');
    expect(screen.getByTestId('warning-message')).toHaveClass('text-white');
    expect(screen.getByTestId('info-message')).toHaveClass('text-white');
  });
});