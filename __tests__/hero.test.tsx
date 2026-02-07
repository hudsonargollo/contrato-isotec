import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Hero,
  HeroSection,
  HeroContent,
  HeroLogo,
  HeroHeading,
  HeroDescription,
  HeroActions,
  HeroMascot,
} from '@/components/ui/hero';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, width, height, className, priority }: any) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        data-priority={priority}
      />
    );
  };
});

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ href, children }: any) {
    return <a href={href}>{children}</a>;
  };
});

describe('Hero Components', () => {
  describe('Hero', () => {
    it('renders with gradient background and solar glow overlay', () => {
      render(
        <Hero data-testid="hero">
          <div>Test content</div>
        </Hero>
      );

      const hero = screen.getByTestId('hero');
      
      // Check gradient background classes
      expect(hero).toHaveClass('bg-gradient-to-br');
      expect(hero).toHaveClass('from-ocean-900');
      expect(hero).toHaveClass('via-ocean-800');
      expect(hero).toHaveClass('to-neutral-900');
      
      // Check layout classes
      expect(hero).toHaveClass('min-h-screen');
      expect(hero).toHaveClass('relative');
      expect(hero).toHaveClass('overflow-hidden');
      
      // Check content is rendered
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Hero className="custom-class" data-testid="hero">
          <div>Test content</div>
        </Hero>
      );

      const hero = screen.getByTestId('hero');
      expect(hero).toHaveClass('custom-class');
    });

    it('renders solar glow overlay elements', () => {
      const { container } = render(
        <Hero>
          <div>Test content</div>
        </Hero>
      );

      // Check for solar glow overlay divs
      const glowElements = container.querySelectorAll('.bg-solar-500\\/20, .bg-solar-600\\/10');
      expect(glowElements.length).toBeGreaterThan(0);
    });
  });

  describe('HeroSection', () => {
    it('renders with responsive padding and centering', () => {
      render(
        <HeroSection data-testid="hero-section">
          <div>Test content</div>
        </HeroSection>
      );

      const section = screen.getByTestId('hero-section');
      
      // Check responsive padding (py-24 md:py-32)
      expect(section).toHaveClass('py-24');
      expect(section).toHaveClass('md:py-32');
      
      // Check centering and layout
      expect(section).toHaveClass('flex');
      expect(section).toHaveClass('min-h-screen');
      expect(section).toHaveClass('flex-col');
      expect(section).toHaveClass('items-center');
      expect(section).toHaveClass('justify-center');
      expect(section).toHaveClass('px-4');
    });
  });

  describe('HeroContent', () => {
    it('renders with max-width constraint and centering', () => {
      render(
        <HeroContent data-testid="hero-content">
          <div>Test content</div>
        </HeroContent>
      );

      const content = screen.getByTestId('hero-content');
      
      // Check max-width constraint
      expect(content).toHaveClass('max-w-5xl');
      expect(content).toHaveClass('w-full');
      
      // Check centering and layout
      expect(content).toHaveClass('flex');
      expect(content).toHaveClass('flex-col');
      expect(content).toHaveClass('items-center');
      expect(content).toHaveClass('gap-8');
      expect(content).toHaveClass('text-center');
    });
  });

  describe('HeroLogo', () => {
    it('renders logo with correct attributes and responsive sizing', () => {
      render(
        <HeroLogo
          src="/test-logo.webp"
          alt="Test Logo"
          width={240}
          height={96}
        />
      );

      const logo = screen.getByAltText('Test Logo');
      
      expect(logo).toHaveAttribute('src', '/test-logo.webp');
      expect(logo).toHaveAttribute('width', '240');
      expect(logo).toHaveAttribute('height', '96');
      expect(logo).toHaveAttribute('data-priority', 'true');
      
      // Check responsive classes
      expect(logo).toHaveClass('w-48');
      expect(logo).toHaveClass('md:w-64');
    });

    it('renders with animation classes', () => {
      const { container } = render(
        <HeroLogo
          src="/test-logo.webp"
          alt="Test Logo"
        />
      );

      const logoContainer = container.firstChild;
      expect(logoContainer).toHaveClass('animate-in');
      expect(logoContainer).toHaveClass('fade-in');
      expect(logoContainer).toHaveClass('slide-in-from-top-4');
      expect(logoContainer).toHaveClass('duration-1000');
    });
  });

  describe('HeroHeading', () => {
    it('renders with responsive typography and animation', () => {
      render(
        <HeroHeading data-testid="hero-heading">
          Test Heading
        </HeroHeading>
      );

      const heading = screen.getByTestId('hero-heading');
      
      // Check responsive typography
      expect(heading).toHaveClass('text-4xl');
      expect(heading).toHaveClass('md:text-5xl');
      expect(heading).toHaveClass('lg:text-6xl');
      expect(heading).toHaveClass('font-bold');
      expect(heading).toHaveClass('text-white');
      
      // Check animation classes
      expect(heading).toHaveClass('animate-in');
      expect(heading).toHaveClass('fade-in');
      expect(heading).toHaveClass('slide-in-from-top-4');
      expect(heading).toHaveClass('duration-1000');
      expect(heading).toHaveClass('delay-150');
      
      // Check semantic HTML
      expect(heading.tagName).toBe('H1');
    });
  });

  describe('HeroDescription', () => {
    it('renders with responsive typography and max-width', () => {
      render(
        <HeroDescription data-testid="hero-description">
          Test description text
        </HeroDescription>
      );

      const description = screen.getByTestId('hero-description');
      
      // Check responsive typography
      expect(description).toHaveClass('text-lg');
      expect(description).toHaveClass('md:text-xl');
      expect(description).toHaveClass('text-neutral-300');
      expect(description).toHaveClass('max-w-2xl');
      
      // Check animation classes
      expect(description).toHaveClass('animate-in');
      expect(description).toHaveClass('fade-in');
      expect(description).toHaveClass('slide-in-from-top-4');
      expect(description).toHaveClass('duration-1000');
      expect(description).toHaveClass('delay-300');
      
      // Check semantic HTML
      expect(description.tagName).toBe('P');
    });
  });

  describe('HeroActions', () => {
    it('renders with responsive layout and animation', () => {
      render(
        <HeroActions data-testid="hero-actions">
          <button>Action 1</button>
          <button>Action 2</button>
        </HeroActions>
      );

      const actions = screen.getByTestId('hero-actions');
      
      // Check responsive layout
      expect(actions).toHaveClass('flex');
      expect(actions).toHaveClass('flex-col');
      expect(actions).toHaveClass('sm:flex-row');
      expect(actions).toHaveClass('gap-4');
      expect(actions).toHaveClass('w-full');
      expect(actions).toHaveClass('sm:w-auto');
      
      // Check animation classes
      expect(actions).toHaveClass('animate-in');
      expect(actions).toHaveClass('fade-in');
      expect(actions).toHaveClass('slide-in-from-top-4');
      expect(actions).toHaveClass('duration-1000');
      expect(actions).toHaveClass('delay-450');
    });

    it('renders CTA buttons with enhanced Button component', () => {
      render(
        <HeroActions data-testid="hero-actions">
          <Link href="/wizard">
            <Button variant="primary" size="lg" className="px-8">
              Criar Novo Contrato
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg" className="px-8">
              🔐 Login Admin
            </Button>
          </Link>
        </HeroActions>
      );

      // Check that buttons are rendered
      const primaryButton = screen.getByText('Criar Novo Contrato');
      const secondaryButton = screen.getByText('🔐 Login Admin');
      
      expect(primaryButton).toBeInTheDocument();
      expect(secondaryButton).toBeInTheDocument();
      
      // Check button styling classes (primary variant)
      expect(primaryButton).toHaveClass('bg-gradient-to-r');
      expect(primaryButton).toHaveClass('from-solar-500');
      expect(primaryButton).toHaveClass('to-solar-600');
      expect(primaryButton).toHaveClass('shadow-lg');
      expect(primaryButton).toHaveClass('shadow-solar-500/30');
      
      // Check button styling classes (secondary variant)
      expect(secondaryButton).toHaveClass('bg-ocean-500');
      expect(secondaryButton).toHaveClass('shadow-md');
      expect(secondaryButton).toHaveClass('shadow-ocean-500/20');
      
      // Check size classes
      expect(primaryButton).toHaveClass('h-11');
      expect(primaryButton).toHaveClass('px-8'); // Custom padding
      expect(secondaryButton).toHaveClass('h-11');
      expect(secondaryButton).toHaveClass('px-8'); // Custom padding
    });
  });

  describe('HeroMascot', () => {
    it('renders mascot with correct positioning and animation', () => {
      render(
        <HeroMascot
          src="/test-mascot.webp"
          alt="Test Mascot"
          width={200}
          height={200}
        />
      );

      const mascot = screen.getByAltText('Test Mascot');
      
      expect(mascot).toHaveAttribute('src', '/test-mascot.webp');
      expect(mascot).toHaveAttribute('width', '200');
      expect(mascot).toHaveAttribute('height', '200');
      expect(mascot).toHaveClass('drop-shadow-2xl');
      expect(mascot).toHaveClass('animate-float');
    });

    it('renders with absolute positioning within hero composition', () => {
      const { container } = render(
        <HeroMascot
          src="/test-mascot.webp"
          alt="Test Mascot"
        />
      );

      const mascotContainer = container.firstChild;
      expect(mascotContainer).toHaveClass('absolute');
      expect(mascotContainer).toHaveClass('bottom-0');
      expect(mascotContainer).toHaveClass('right-8');
      expect(mascotContainer).toHaveClass('xl:right-16');
      expect(mascotContainer).toHaveClass('hidden');
      expect(mascotContainer).toHaveClass('lg:block');
      expect(mascotContainer).toHaveClass('animate-in');
      expect(mascotContainer).toHaveClass('fade-in');
      expect(mascotContainer).toHaveClass('slide-in-from-bottom-8');
    });
  });

  describe('Integration', () => {
    it('renders complete hero section with all components', () => {
      render(
        <Hero>
          <HeroSection>
            <HeroContent>
              <HeroLogo src="/logo.webp" alt="Logo" />
              <HeroHeading>Main Heading</HeroHeading>
              <HeroDescription>Description text</HeroDescription>
              <HeroActions>
                <button>Primary Action</button>
                <button>Secondary Action</button>
              </HeroActions>
            </HeroContent>
          </HeroSection>
          <HeroMascot src="/mascot.webp" alt="Mascot" />
        </Hero>
      );

      // Check all components are rendered
      expect(screen.getByAltText('Logo')).toBeInTheDocument();
      expect(screen.getByText('Main Heading')).toBeInTheDocument();
      expect(screen.getByText('Description text')).toBeInTheDocument();
      expect(screen.getByText('Primary Action')).toBeInTheDocument();
      expect(screen.getByText('Secondary Action')).toBeInTheDocument();
      expect(screen.getByAltText('Mascot')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses semantic HTML elements', () => {
      render(
        <Hero>
          <HeroSection>
            <HeroContent>
              <HeroHeading>Main Heading</HeroHeading>
              <HeroDescription>Description text</HeroDescription>
            </HeroContent>
          </HeroSection>
        </Hero>
      );

      // Check semantic elements
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('provides proper alt text for images', () => {
      render(
        <HeroLogo src="/logo.webp" alt="Company Logo" />
      );

      const logo = screen.getByAltText('Company Logo');
      expect(logo).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes correctly', () => {
      render(
        <Hero>
          <HeroSection data-testid="section">
            <HeroContent data-testid="content">
              <HeroLogo src="/logo.webp" alt="Logo" data-testid="logo" />
              <HeroHeading data-testid="heading">Heading</HeroHeading>
              <HeroDescription data-testid="description">Description</HeroDescription>
            </HeroContent>
          </HeroSection>
        </Hero>
      );

      // Check responsive padding
      const section = screen.getByTestId('section');
      expect(section).toHaveClass('py-24', 'md:py-32');

      // Check responsive typography
      const heading = screen.getByTestId('heading');
      expect(heading).toHaveClass('text-4xl', 'md:text-5xl', 'lg:text-6xl');

      const description = screen.getByTestId('description');
      expect(description).toHaveClass('text-lg', 'md:text-xl');

      // Check responsive logo sizing
      const logo = screen.getByAltText('Logo');
      expect(logo).toHaveClass('w-48', 'md:w-64');
    });
  });
});