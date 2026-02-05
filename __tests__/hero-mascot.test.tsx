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

  it('has correct positioning classes', () => {
    const { container } = render(
      <HeroMascot
        src="/mascote.webp"
        alt="ISOTEC Mascot"
      />
    );

    const mascotContainer = container.firstChild as HTMLElement;
    expect(mascotContainer).toHaveClass('fixed', 'bottom-8', 'right-8', 'hidden', 'lg:block', 'animate-float');
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
        width={160}
        height={160}
      />
    );

    const mascotImage = screen.getByAltText('ISOTEC Mascot');
    expect(mascotImage).toHaveAttribute('width', '160');
    expect(mascotImage).toHaveAttribute('height', '160');
  });

  it('has drop shadow styling', () => {
    render(
      <HeroMascot
        src="/mascote.webp"
        alt="ISOTEC Mascot"
      />
    );

    const mascotImage = screen.getByAltText('ISOTEC Mascot');
    expect(mascotImage).toHaveClass('drop-shadow-2xl');
  });
});