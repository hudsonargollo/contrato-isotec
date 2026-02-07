import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe('Landing Page Integration', () => {
  it('renders complete landing page with mascot', () => {
    render(<Home />);

    // Check that main elements are present
    expect(screen.getByText('Sistema de Contratos Fotovoltaicos')).toBeInTheDocument();
    expect(screen.getByText(/Gestão completa de contratos para instalação de energia solar fotovoltaica/)).toBeInTheDocument();
    
    // Check that CTA buttons are present
    expect(screen.getByText('Criar Novo Contrato')).toBeInTheDocument();
    expect(screen.getByText('🔐 Login Admin')).toBeInTheDocument();
    
    // Check that logo is present
    expect(screen.getByAltText('ISOTEC Logo')).toBeInTheDocument();
    
    // Check that mascot is present
    expect(screen.getByAltText('ISOTEC Mascot')).toBeInTheDocument();
    
    // Check that feature cards are present
    expect(screen.getByText('Rápido e Fácil')).toBeInTheDocument();
    expect(screen.getByText('Seguro')).toBeInTheDocument();
    expect(screen.getByText('Completo')).toBeInTheDocument();
  });

  it('mascot has correct positioning and animation classes', () => {
    const { container } = render(<Home />);
    
    // Find the mascot container
    const mascotImage = screen.getByAltText('ISOTEC Mascot');
    const mascotContainer = mascotImage.parentElement;
    
    expect(mascotContainer).toHaveClass(
      'absolute',
      'bottom-0', 
      'right-8',
      'xl:right-16',
      'hidden',
      'lg:block',
      'animate-in',
      'fade-in',
      'slide-in-from-bottom-8'
    );
  });

  it('mascot image has correct attributes', () => {
    render(<Home />);
    
    const mascotImage = screen.getByAltText('ISOTEC Mascot');
    expect(mascotImage).toHaveAttribute('src', expect.stringContaining('mascote.webp'));
    expect(mascotImage).toHaveClass('drop-shadow-2xl');
    expect(mascotImage).toHaveClass('animate-float');
  });
});