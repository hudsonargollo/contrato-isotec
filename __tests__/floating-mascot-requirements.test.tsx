import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe('Hero Mascot Composition Requirements Validation', () => {
  describe('Task 5.4: Mascot integrated into hero composition', () => {
    it('positions mascot within hero composition (absolute bottom-0 right-8)', () => {
      const { container } = render(<Home />);
      
      const mascotImage = screen.getByAltText('ISOTEC Mascot');
      const mascotContainer = mascotImage.parentElement;
      
      // Verify absolute positioning within hero composition
      expect(mascotContainer).toHaveClass('absolute');
      expect(mascotContainer).toHaveClass('bottom-0');
      expect(mascotContainer).toHaveClass('right-8');
      expect(mascotContainer).toHaveClass('xl:right-16');
    });

    it('implements float animation and entrance animation', () => {
      const { container } = render(<Home />);
      
      const mascotImage = screen.getByAltText('ISOTEC Mascot');
      const mascotContainer = mascotImage.parentElement;
      
      // Verify float animation is applied to image
      expect(mascotImage).toHaveClass('animate-float');
      
      // Verify entrance animation is applied to container
      expect(mascotContainer).toHaveClass('animate-in');
      expect(mascotContainer).toHaveClass('fade-in');
      expect(mascotContainer).toHaveClass('slide-in-from-bottom-8');
    });

    it('hides on mobile, shows on desktop (hidden lg:block)', () => {
      const { container } = render(<Home />);
      
      const mascotImage = screen.getByAltText('ISOTEC Mascot');
      const mascotContainer = mascotImage.parentElement;
      
      // Verify responsive visibility
      expect(mascotContainer).toHaveClass('hidden');
      expect(mascotContainer).toHaveClass('lg:block');
    });

    it('validates Requirements 2.5 - ISOTEC mascot strategic incorporation', () => {
      render(<Home />);
      
      const mascotImage = screen.getByAltText('ISOTEC Mascot');
      
      // Verify mascot is present and accessible
      expect(mascotImage).toBeInTheDocument();
      expect(mascotImage).toHaveAttribute('alt', 'ISOTEC Mascot');
      expect(mascotImage).toHaveAttribute('src', expect.stringContaining('mascote.webp'));
      
      // Verify mascot has visual enhancement (drop shadow)
      expect(mascotImage).toHaveClass('drop-shadow-2xl');
    });

    it('integrates seamlessly with hero composition', () => {
      render(<Home />);
      
      const mascotImage = screen.getByAltText('ISOTEC Mascot');
      const mascotContainer = mascotImage.parentElement;
      
      // Verify absolute positioning integrates with hero layout
      expect(mascotContainer).toHaveClass('absolute');
      
      // Verify main content is still accessible and not overlapped
      expect(screen.getByText('Sistema de Contratos Fotovoltaicos')).toBeInTheDocument();
      expect(screen.getByText('Criar Novo Contrato')).toBeInTheDocument();
    });

    it('has appropriate size for hero composition', () => {
      render(<Home />);
      
      const mascotImage = screen.getByAltText('ISOTEC Mascot');
      
      // Verify larger dimensions for hero composition (200x200 default)
      expect(mascotImage).toHaveAttribute('width', '200');
      expect(mascotImage).toHaveAttribute('height', '200');
      
      // Verify responsive sizing classes
      expect(mascotImage).toHaveClass('w-48');
      expect(mascotImage).toHaveClass('xl:w-60');
    });

    it('uses semantic HTML and accessibility best practices', () => {
      render(<Home />);
      
      const mascotImage = screen.getByAltText('ISOTEC Mascot');
      
      // Verify proper alt text for screen readers
      expect(mascotImage).toHaveAttribute('alt', 'ISOTEC Mascot');
      
      // Verify it's an img element (semantic HTML)
      expect(mascotImage.tagName).toBe('IMG');
    });

    it('integrates with the overall hero design system', () => {
      const { container } = render(<Home />);
      
      // Verify hero container exists
      const heroMain = container.querySelector('main');
      expect(heroMain).toHaveClass('min-h-screen', 'relative', 'overflow-hidden');
      expect(heroMain).toHaveClass('bg-gradient-to-br', 'from-ocean-900', 'via-ocean-800', 'to-neutral-900');
      
      // Verify mascot is within the hero structure
      const mascotImage = screen.getByAltText('ISOTEC Mascot');
      expect(heroMain).toContainElement(mascotImage);
    });
  });

  describe('Animation and Performance', () => {
    it('uses CSS-based animation for performance', () => {
      const { container } = render(<Home />);
      
      const mascotImage = screen.getByAltText('ISOTEC Mascot');
      const mascotContainer = mascotImage.parentElement;
      
      // Verify uses Tailwind animation classes (CSS-based, not JS-based)
      expect(mascotImage).toHaveClass('animate-float');
      expect(mascotContainer).toHaveClass('animate-in');
      
      // Verify no inline styles that would indicate JS animation
      expect(mascotContainer).not.toHaveAttribute('style');
    });

    it('provides visual interest as part of hero composition', () => {
      render(<Home />);
      
      const mascotImage = screen.getByAltText('ISOTEC Mascot');
      const mascotContainer = mascotImage.parentElement;
      
      // Verify positioned as part of hero composition
      expect(mascotContainer).toHaveClass('bottom-0', 'right-8');
      
      // Verify only visible on larger screens where it enhances the design
      expect(mascotContainer).toHaveClass('hidden', 'lg:block');
    });
  });

  describe('Responsive Design', () => {
    it('follows mobile-first responsive design principles', () => {
      const { container } = render(<Home />);
      
      const mascotImage = screen.getByAltText('ISOTEC Mascot');
      const mascotContainer = mascotImage.parentElement;
      
      // Verify hidden by default (mobile-first)
      expect(mascotContainer).toHaveClass('hidden');
      
      // Verify shown only on large screens
      expect(mascotContainer).toHaveClass('lg:block');
    });

    it('maintains proper spacing within hero composition', () => {
      const { container } = render(<Home />);
      
      const mascotImage = screen.getByAltText('ISOTEC Mascot');
      const mascotContainer = mascotImage.parentElement;
      
      // Verify proper spacing from edges with responsive adjustments
      expect(mascotContainer).toHaveClass('bottom-0', 'right-8', 'xl:right-16');
    });

    it('scales appropriately on different screen sizes', () => {
      render(<Home />);
      
      const mascotImage = screen.getByAltText('ISOTEC Mascot');
      
      // Verify responsive sizing
      expect(mascotImage).toHaveClass('w-48', 'xl:w-60');
    });
  });
});