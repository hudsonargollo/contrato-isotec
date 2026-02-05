import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import fc from 'fast-check';
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

describe('Hero Component Properties', () => {
  /**
   * **Validates: Requirements 1.4, 2.1, 2.4**
   * 
   * Property 1: Hero Background Consistency
   * For any Hero component instance, it should always render with the correct
   * gradient background (ocean-900 to neutral-900) and solar glow overlay effects.
   */
  it('Property 1: Hero always renders with correct gradient background and solar glow overlay', () => {
    fc.assert(
      fc.property(
        fc.record({
          className: fc.option(fc.string(), { nil: undefined }),
          children: fc.constant(<div>Test content</div>),
        }),
        (props) => {
          const { container } = render(<Hero {...props} />);
          const heroElement = container.firstChild as HTMLElement;

          // Verify gradient background classes are always present
          expect(heroElement).toHaveClass('bg-gradient-to-br');
          expect(heroElement).toHaveClass('from-ocean-900');
          expect(heroElement).toHaveClass('via-ocean-800');
          expect(heroElement).toHaveClass('to-neutral-900');

          // Verify layout classes are always present
          expect(heroElement).toHaveClass('min-h-screen');
          expect(heroElement).toHaveClass('relative');
          expect(heroElement).toHaveClass('overflow-hidden');

          // Verify solar glow overlay elements exist
          const glowElements = container.querySelectorAll('[class*="bg-solar-"]');
          expect(glowElements.length).toBeGreaterThanOrEqual(2);

          // Verify content container with z-index exists
          const contentContainer = container.querySelector('.relative.z-10');
          expect(contentContainer).toBeInTheDocument();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * Property 2: Responsive Padding Consistency
   * For any HeroSection component, it should always apply the correct responsive
   * padding (py-24 md:py-32) and centering classes regardless of content.
   */
  it('Property 2: HeroSection always applies correct responsive padding and centering', () => {
    fc.assert(
      fc.property(
        fc.record({
          className: fc.option(fc.string(), { nil: undefined }),
          children: fc.array(fc.constant(<div key={Math.random()}>Content</div>), { minLength: 1, maxLength: 5 }),
        }),
        (props) => {
          const { container } = render(<HeroSection {...props} />);
          const sectionElement = container.firstChild as HTMLElement;

          // Verify responsive padding is always applied
          expect(sectionElement).toHaveClass('py-24');
          expect(sectionElement).toHaveClass('md:py-32');

          // Verify centering and layout classes are always applied
          expect(sectionElement).toHaveClass('flex');
          expect(sectionElement).toHaveClass('min-h-screen');
          expect(sectionElement).toHaveClass('flex-col');
          expect(sectionElement).toHaveClass('items-center');
          expect(sectionElement).toHaveClass('justify-center');
          expect(sectionElement).toHaveClass('px-4');
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * Property 3: Max-Width Constraint Consistency
   * For any HeroContent component, it should always apply the max-width constraint
   * (max-w-5xl) and proper centering regardless of the number of children.
   */
  it('Property 3: HeroContent always applies max-width constraint and centering', () => {
    fc.assert(
      fc.property(
        fc.record({
          className: fc.option(fc.string(), { nil: undefined }),
          children: fc.array(fc.constant(<div key={Math.random()}>Content</div>), { minLength: 1, maxLength: 10 }),
        }),
        (props) => {
          const { container } = render(<HeroContent {...props} />);
          const contentElement = container.firstChild as HTMLElement;

          // Verify max-width constraint is always applied
          expect(contentElement).toHaveClass('max-w-5xl');
          expect(contentElement).toHaveClass('w-full');

          // Verify centering and layout classes are always applied
          expect(contentElement).toHaveClass('flex');
          expect(contentElement).toHaveClass('flex-col');
          expect(contentElement).toHaveClass('items-center');
          expect(contentElement).toHaveClass('gap-8');
          expect(contentElement).toHaveClass('text-center');
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Validates: Requirements 2.1, 2.4**
   * 
   * Property 4: Logo Responsive Sizing
   * For any HeroLogo component with valid image properties, it should always
   * render with responsive sizing classes and proper image attributes.
   */
  it('Property 4: HeroLogo always renders with responsive sizing and proper attributes', () => {
    fc.assert(
      fc.property(
        fc.record({
          src: fc.string({ minLength: 1 }).map(s => `/images/${s}.webp`),
          alt: fc.string({ minLength: 1 }),
          width: fc.option(fc.integer({ min: 50, max: 500 }), { nil: 240 }),
          height: fc.option(fc.integer({ min: 50, max: 500 }), { nil: 96 }),
          className: fc.option(fc.string(), { nil: undefined }),
        }),
        (props) => {
          const { container } = render(<HeroLogo {...props} />);
          const logoContainer = container.firstChild as HTMLElement;
          const logoImage = container.querySelector('img') as HTMLImageElement;

          // Verify animation classes are always applied to container
          expect(logoContainer).toHaveClass('animate-in');
          expect(logoContainer).toHaveClass('fade-in');
          expect(logoContainer).toHaveClass('slide-in-from-top-4');
          expect(logoContainer).toHaveClass('duration-1000');

          // Verify responsive sizing classes are always applied to image
          expect(logoImage).toHaveClass('w-48');
          expect(logoImage).toHaveClass('md:w-64');

          // Verify image attributes are correctly set
          expect(logoImage).toHaveAttribute('src', props.src);
          expect(logoImage).toHaveAttribute('alt', props.alt);
          expect(logoImage).toHaveAttribute('data-priority', 'true');
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Validates: Requirements 1.4, 2.1**
   * 
   * Property 5: Typography Hierarchy Consistency
   * For any HeroHeading component, it should always render as an h1 element
   * with responsive typography classes and proper animation timing.
   */
  it('Property 5: HeroHeading always renders with correct typography hierarchy and animation', () => {
    fc.assert(
      fc.property(
        fc.record({
          children: fc.string({ minLength: 1 }),
          className: fc.option(fc.string(), { nil: undefined }),
        }),
        (props) => {
          const { container } = render(<HeroHeading {...props} />);
          const headingElement = container.firstChild as HTMLElement;

          // Verify semantic HTML element
          expect(headingElement.tagName).toBe('H1');

          // Verify responsive typography classes are always applied
          expect(headingElement).toHaveClass('text-4xl');
          expect(headingElement).toHaveClass('md:text-5xl');
          expect(headingElement).toHaveClass('lg:text-6xl');
          expect(headingElement).toHaveClass('font-bold');
          expect(headingElement).toHaveClass('text-white');

          // Verify animation classes with correct timing
          expect(headingElement).toHaveClass('animate-in');
          expect(headingElement).toHaveClass('fade-in');
          expect(headingElement).toHaveClass('slide-in-from-top-4');
          expect(headingElement).toHaveClass('duration-1000');
          expect(headingElement).toHaveClass('delay-150');
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * Property 6: Mascot Positioning Consistency
   * For any HeroMascot component, it should always render with fixed positioning,
   * responsive visibility, and floating animation regardless of image properties.
   */
  it('Property 6: HeroMascot always renders with correct positioning and animation', () => {
    fc.assert(
      fc.property(
        fc.record({
          src: fc.string({ minLength: 1 }).map(s => `/images/${s}.webp`),
          alt: fc.string({ minLength: 1 }),
          width: fc.option(fc.integer({ min: 50, max: 200 }), { nil: 120 }),
          height: fc.option(fc.integer({ min: 50, max: 200 }), { nil: 120 }),
          className: fc.option(fc.string(), { nil: undefined }),
        }),
        (props) => {
          const { container } = render(<HeroMascot {...props} />);
          const mascotContainer = container.firstChild as HTMLElement;
          const mascotImage = container.querySelector('img') as HTMLImageElement;

          // Verify fixed positioning classes are always applied
          expect(mascotContainer).toHaveClass('fixed');
          expect(mascotContainer).toHaveClass('bottom-8');
          expect(mascotContainer).toHaveClass('right-8');

          // Verify responsive visibility classes are always applied
          expect(mascotContainer).toHaveClass('hidden');
          expect(mascotContainer).toHaveClass('lg:block');

          // Verify floating animation is always applied
          expect(mascotContainer).toHaveClass('animate-float');

          // Verify image styling is always applied
          expect(mascotImage).toHaveClass('drop-shadow-2xl');

          // Verify image attributes are correctly set
          expect(mascotImage).toHaveAttribute('src', props.src);
          expect(mascotImage).toHaveAttribute('alt', props.alt);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * Property 7: Animation Timing Sequence
   * For a complete hero section with all components, the animation delays should
   * follow the correct sequence (logo: 0ms, heading: 150ms, description: 300ms, actions: 450ms).
   */
  it('Property 7: Hero components always render with correct animation timing sequence', () => {
    fc.assert(
      fc.property(
        fc.record({
          logoSrc: fc.string({ minLength: 1 }).map(s => `/images/${s}.webp`),
          logoAlt: fc.string({ minLength: 1 }),
          headingText: fc.string({ minLength: 1 }),
          descriptionText: fc.string({ minLength: 1 }),
        }),
        (props) => {
          const { container } = render(
            <Hero>
              <HeroSection>
                <HeroContent>
                  <HeroLogo src={props.logoSrc} alt={props.logoAlt} />
                  <HeroHeading>{props.headingText}</HeroHeading>
                  <HeroDescription>{props.descriptionText}</HeroDescription>
                  <HeroActions>
                    <button>Action</button>
                  </HeroActions>
                </HeroContent>
              </HeroSection>
            </Hero>
          );

          // Verify logo has no delay (base animation)
          const logoContainer = container.querySelector('.animate-in.fade-in.slide-in-from-top-4.duration-1000:not([class*="delay"])');
          expect(logoContainer).toBeInTheDocument();

          // Verify heading has 150ms delay
          const heading = container.querySelector('h1');
          expect(heading).toHaveClass('delay-150');

          // Verify description has 300ms delay
          const description = container.querySelector('p');
          expect(description).toHaveClass('delay-300');

          // Verify actions have 450ms delay
          const actions = container.querySelector('.delay-450');
          expect(actions).toBeInTheDocument();
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * **Validates: Requirements 2.1, 2.4**
   * 
   * Property 8: Brand Color Consistency
   * For any Hero component, the solar glow overlay should always use the correct
   * brand colors (solar-500 and solar-600) with appropriate opacity levels.
   */
  it('Property 8: Hero always renders solar glow overlay with correct brand colors', () => {
    fc.assert(
      fc.property(
        fc.record({
          className: fc.option(fc.string(), { nil: undefined }),
          children: fc.constant(<div>Content</div>),
        }),
        (props) => {
          const { container } = render(<Hero {...props} />);

          // Verify solar glow elements use correct brand colors
          const solarGlow1 = container.querySelector('.bg-solar-500\\/20');
          const solarGlow2 = container.querySelector('.bg-solar-600\\/10');

          expect(solarGlow1).toBeInTheDocument();
          expect(solarGlow2).toBeInTheDocument();

          // Verify glow elements have correct positioning and blur
          expect(solarGlow1).toHaveClass('absolute', 'top-0', 'right-0', 'rounded-full', 'blur-3xl');
          expect(solarGlow2).toHaveClass('absolute', 'bottom-0', 'left-0', 'rounded-full', 'blur-3xl');
        }
      ),
      { numRuns: 50 }
    );
  });
});