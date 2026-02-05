import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe('Floating Mascot Requirements Validation', () => {
  describe('Task 5.4: Add floating mascot with animation', () => {
    it('positions mascot at bottom-right (fixed bottom-8 right-8)', () => {
      const { container } = render(<Home />);
      
      const mascotImage = screen.getByAltText('ISOTEC Mascot');
      const mascotContainer = mascotImage.parentElement;
      
      // Verify fixed positioning at bottom-right
      expect(mascotContainer).toHaveClass('fixed');
      expect(mascotContainer).toHaveClass('bottom-8');
      expect(mascotContainer).toHaveClass('right-8');
    });

    it('implements float animation', () => {
      const { container } = render(<Home />);
      
      const mascotImage = screen.getByAltText('ISOTEC Mascot');
      const mascotContainer = mascotImage.parentElement;
      
      // Verify float animation is applied
      expect(mascotContainer).toHaveClass('animate-float');
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

    it('does not interfere with main content', () => {
      render(<Home />);
      
      const mascotImage = screen.getByAltText('ISOTEC Mascot');
      const mascotContainer = mascotImage.parentElement;
      
      // Verify fixed positioning removes it from document flow
      expect(mascotContainer).toHaveClass('fixed');
      
      // Verify main content is still accessible
      expect(screen.getByText('Sistema de Contratos Fotovoltaicos')).toBeInTheDocument();
      expect(screen.getByText('Criar Novo Contrato')).toBeInTheDocument();
    });

    it('has appropriate size for desktop viewing', () => {
      render(<Home />);
      
      const mascotImage = screen.getByAltText('ISOTEC Mascot');
      
      // Verify default dimensions (120x120 as specified in component)
      expect(mascotImage).toHaveAttribute('width', '120');
      expect(mascotImage).toHaveAttribute('height', '120');
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
      
      // Verify uses Tailwind animation class (CSS-based, not JS-based)
      expect(mascotContainer).toHaveClass('animate-float');
      
      // Verify no inline styles that would indicate JS animation
      expect(mascotContainer).not.toHaveAttribute('style');
    });

    it('provides visual interest without being distracting', () => {
      render(<Home />);
      
      const mascotImage = screen.getByAltText('ISOTEC Mascot');
      const mascotContainer = mascotImage.parentElement;
      
      // Verify positioned away from main content
      expect(mascotContainer).toHaveClass('bottom-8', 'right-8');
      
      // Verify only visible on larger screens where it won't interfere
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

    it('maintains proper spacing on desktop', () => {
      const { container } = render(<Home />);
      
      const mascotImage = screen.getByAltText('ISOTEC Mascot');
      const mascotContainer = mascotImage.parentElement;
      
      // Verify proper spacing from edges (8 * 4px = 32px)
      expect(mascotContainer).toHaveClass('bottom-8', 'right-8');
    });
  });
});