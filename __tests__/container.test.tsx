/**
 * Container Component Tests
 * Tests for responsive container with max-width constraints and padding
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Container, SectionContainer, ContentContainer, NarrowContainer } from '@/components/ui/container';

describe('Container Component', () => {
  describe('Basic Container', () => {
    it('renders children correctly', () => {
      render(
        <Container data-testid="container">
          <div>Test content</div>
        </Container>
      );
      
      const container = screen.getByTestId('container');
      expect(container).toBeInTheDocument();
      expect(container).toHaveTextContent('Test content');
    });

    it('applies default size and padding classes', () => {
      render(
        <Container data-testid="container">
          Test content
        </Container>
      );
      
      const container = screen.getByTestId('container');
      expect(container).toHaveClass('w-full');
      expect(container).toHaveClass('max-w-screen-xl'); // default size
      expect(container).toHaveClass('px-4', 'py-4', 'md:px-8', 'md:py-6'); // default padding
      expect(container).toHaveClass('mx-auto'); // default centered
    });

    it('applies custom size variants correctly', () => {
      const sizes = ['sm', 'md', 'lg', 'xl', '2xl', 'full', 'none'] as const;
      
      sizes.forEach((size) => {
        const { rerender } = render(
          <Container size={size} data-testid={`container-${size}`}>
            Test content
          </Container>
        );
        
        const container = screen.getByTestId(`container-${size}`);
        
        switch (size) {
          case 'sm':
            expect(container).toHaveClass('max-w-screen-sm');
            break;
          case 'md':
            expect(container).toHaveClass('max-w-screen-md');
            break;
          case 'lg':
            expect(container).toHaveClass('max-w-screen-lg');
            break;
          case 'xl':
            expect(container).toHaveClass('max-w-screen-xl');
            break;
          case '2xl':
            expect(container).toHaveClass('max-w-screen-2xl');
            break;
          case 'full':
            expect(container).toHaveClass('max-w-full');
            break;
          case 'none':
            expect(container).not.toHaveClass('max-w-screen-sm');
            expect(container).not.toHaveClass('max-w-screen-md');
            expect(container).not.toHaveClass('max-w-screen-lg');
            expect(container).not.toHaveClass('max-w-screen-xl');
            expect(container).not.toHaveClass('max-w-screen-2xl');
            expect(container).not.toHaveClass('max-w-full');
            break;
        }
      });
    });

    it('applies custom padding variants correctly', () => {
      const paddings = ['none', 'sm', 'md', 'lg', 'xl'] as const;
      
      paddings.forEach((padding) => {
        render(
          <Container padding={padding} data-testid={`container-${padding}`}>
            Test content
          </Container>
        );
        
        const container = screen.getByTestId(`container-${padding}`);
        
        switch (padding) {
          case 'none':
            expect(container).not.toHaveClass('px-4');
            expect(container).not.toHaveClass('py-2');
            break;
          case 'sm':
            expect(container).toHaveClass('px-4', 'py-2', 'md:px-6', 'md:py-4');
            break;
          case 'md':
            expect(container).toHaveClass('px-4', 'py-4', 'md:px-8', 'md:py-6');
            break;
          case 'lg':
            expect(container).toHaveClass('px-6', 'py-6', 'md:px-12', 'md:py-8');
            break;
          case 'xl':
            expect(container).toHaveClass('px-8', 'py-8', 'md:px-16', 'md:py-12');
            break;
        }
      });
    });

    it('handles centered prop correctly', () => {
      // Test centered=true (default)
      render(
        <Container data-testid="container-centered">
          Test content
        </Container>
      );
      
      const centeredContainer = screen.getByTestId('container-centered');
      expect(centeredContainer).toHaveClass('mx-auto');

      // Test centered=false
      render(
        <Container centered={false} data-testid="container-not-centered">
          Test content
        </Container>
      );
      
      const notCenteredContainer = screen.getByTestId('container-not-centered');
      expect(notCenteredContainer).not.toHaveClass('mx-auto');
    });

    it('merges custom className correctly', () => {
      render(
        <Container className="custom-class bg-red-500" data-testid="container">
          Test content
        </Container>
      );
      
      const container = screen.getByTestId('container');
      expect(container).toHaveClass('custom-class');
      expect(container).toHaveClass('bg-red-500');
      expect(container).toHaveClass('w-full'); // Still has base classes
    });

    it('passes through additional props', () => {
      render(
        <Container id="test-id" role="main" data-testid="container">
          Test content
        </Container>
      );
      
      const container = screen.getByTestId('container');
      expect(container).toHaveAttribute('id', 'test-id');
      expect(container).toHaveAttribute('role', 'main');
    });
  });

  describe('SectionContainer', () => {
    it('renders with section-specific defaults', () => {
      render(
        <SectionContainer data-testid="section-container">
          Section content
        </SectionContainer>
      );
      
      const container = screen.getByTestId('section-container');
      expect(container).toHaveClass('relative'); // Section-specific class
      expect(container).toHaveClass('max-w-screen-xl'); // Default size
      expect(container).toHaveClass('px-6', 'py-6', 'md:px-12', 'md:py-8'); // lg padding
    });

    it('accepts custom props', () => {
      render(
        <SectionContainer size="md" padding="sm" className="custom-section" data-testid="section-container">
          Section content
        </SectionContainer>
      );
      
      const container = screen.getByTestId('section-container');
      expect(container).toHaveClass('max-w-screen-md');
      expect(container).toHaveClass('px-4', 'py-2', 'md:px-6', 'md:py-4');
      expect(container).toHaveClass('custom-section');
      expect(container).toHaveClass('relative');
    });
  });

  describe('ContentContainer', () => {
    it('renders with content-specific defaults', () => {
      render(
        <ContentContainer data-testid="content-container">
          Content text
        </ContentContainer>
      );
      
      const container = screen.getByTestId('content-container');
      expect(container).toHaveClass('max-w-screen-lg'); // Fixed size for content
      expect(container).toHaveClass('prose', 'prose-neutral');
    });

    it('accepts custom props except size', () => {
      render(
        <ContentContainer padding="sm" className="custom-content" data-testid="content-container">
          Content text
        </ContentContainer>
      );
      
      const container = screen.getByTestId('content-container');
      expect(container).toHaveClass('max-w-screen-lg'); // Size is fixed
      expect(container).toHaveClass('px-4', 'py-2', 'md:px-6', 'md:py-4');
      expect(container).toHaveClass('custom-content');
    });
  });

  describe('NarrowContainer', () => {
    it('renders with narrow-specific defaults', () => {
      render(
        <NarrowContainer data-testid="narrow-container">
          Form content
        </NarrowContainer>
      );
      
      const container = screen.getByTestId('narrow-container');
      expect(container).toHaveClass('max-w-2xl'); // Narrow width
      expect(container).toHaveClass('w-full'); // Base width
      expect(container).toHaveClass('mx-auto'); // Centered by default
    });

    it('accepts custom props except size', () => {
      render(
        <NarrowContainer padding="xl" className="custom-narrow" data-testid="narrow-container">
          Form content
        </NarrowContainer>
      );
      
      const container = screen.getByTestId('narrow-container');
      expect(container).toHaveClass('max-w-2xl'); // Size is fixed
      expect(container).toHaveClass('px-8', 'py-8', 'md:px-16', 'md:py-12');
      expect(container).toHaveClass('custom-narrow');
    });
  });

  describe('Responsive Behavior', () => {
    it('applies responsive padding classes correctly', () => {
      render(
        <Container padding="md" data-testid="container">
          Test content
        </Container>
      );
      
      const container = screen.getByTestId('container');
      
      // Check that responsive classes are present
      expect(container).toHaveClass('px-4'); // Mobile padding
      expect(container).toHaveClass('py-4'); // Mobile padding
      expect(container).toHaveClass('md:px-8'); // Tablet+ padding
      expect(container).toHaveClass('md:py-6'); // Tablet+ padding
    });

    it('handles max-width constraints for different breakpoints', () => {
      const breakpoints = [
        { size: 'sm' as const, expectedClass: 'max-w-screen-sm' },
        { size: 'md' as const, expectedClass: 'max-w-screen-md' },
        { size: 'lg' as const, expectedClass: 'max-w-screen-lg' },
        { size: 'xl' as const, expectedClass: 'max-w-screen-xl' },
        { size: '2xl' as const, expectedClass: 'max-w-screen-2xl' },
      ];

      breakpoints.forEach(({ size, expectedClass }) => {
        render(
          <Container size={size} data-testid={`container-${size}`}>
            Test content
          </Container>
        );
        
        const container = screen.getByTestId(`container-${size}`);
        expect(container).toHaveClass(expectedClass);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children', () => {
      render(
        <Container data-testid="container">
          {null}
        </Container>
      );
      
      const container = screen.getByTestId('container');
      expect(container).toBeInTheDocument();
      expect(container).toBeEmptyDOMElement();
    });

    it('handles multiple children', () => {
      render(
        <Container data-testid="container">
          <div>Child 1</div>
          <div>Child 2</div>
          <span>Child 3</span>
        </Container>
      );
      
      const container = screen.getByTestId('container');
      expect(container).toHaveTextContent('Child 1');
      expect(container).toHaveTextContent('Child 2');
      expect(container).toHaveTextContent('Child 3');
    });

    it('handles complex nested content', () => {
      render(
        <Container data-testid="container">
          <div>
            <h1>Title</h1>
            <p>Description</p>
            <div>
              <button>Action</button>
            </div>
          </div>
        </Container>
      );
      
      const container = screen.getByTestId('container');
      expect(container).toHaveTextContent('Title');
      expect(container).toHaveTextContent('Description');
      expect(container).toHaveTextContent('Action');
    });
  });
});