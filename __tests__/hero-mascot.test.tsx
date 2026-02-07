import React from 'react';
import { render, screen } from '@testing-library/react';
import { HeroMascot } from '@/components/ui/hero';

describe('HeroMascot', () => {
  it('renders mascot image with correct attributes', () => {
    render(
      <HeroMascot
        src="/mascote.webp"
        alt="ISOTEC Mascot"
      />
    );

    const mascotImage = screen.getByAltText('ISOTEC Mascot');
    expect(mascotImage).toBeInTheDocument();
    expect(mascotImage).toHaveAttribute('src', expect.stringContaining('mascote.webp'));
  });

  it('has correct positioning classes for hero composition', () => {
    const { container } = render(
      <HeroMascot
        src="/mascote.webp"
        alt="ISOTEC Mascot"
      />
    );

    const mascotContainer = container.firstChild as HTMLElement;
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

  it('applies custom className when provided', () => {
    const { container } = render(
      <HeroMascot
        src="/mascote.webp"
        alt="ISOTEC Mascot"
        className="custom-class"
      />
    );

    const mascotContainer = container.firstChild as HTMLElement;
    expect(mascotContainer).toHaveClass('custom-class');
  });

  it('uses custom dimensions when provided', () => {
    render(
      <HeroMascot
        src="/mascote.webp"
        alt="ISOTEC Mascot"
        width={240}
        height={240}
      />
    );

    const mascotImage = screen.getByAltText('ISOTEC Mascot');
    expect(mascotImage).toHaveAttribute('width', '240');
    expect(mascotImage).toHaveAttribute('height', '240');
  });

  it('has drop shadow styling and float animation', () => {
    render(
      <HeroMascot
        src="/mascote.webp"
        alt="ISOTEC Mascot"
      />
    );

    const mascotImage = screen.getByAltText('ISOTEC Mascot');
    expect(mascotImage).toHaveClass('drop-shadow-2xl');
    expect(mascotImage).toHaveClass('animate-float');
  });

  it('has responsive sizing classes', () => {
    render(
      <HeroMascot
        src="/mascote.webp"
        alt="ISOTEC Mascot"
      />
    );

    const mascotImage = screen.getByAltText('ISOTEC Mascot');
    expect(mascotImage).toHaveClass('w-48');
    expect(mascotImage).toHaveClass('xl:w-60');
  });
});