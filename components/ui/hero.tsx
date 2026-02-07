import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface HeroProps {
  className?: string;
  children?: React.ReactNode;
}

interface HeroSectionProps {
  className?: string;
  children: React.ReactNode;
}

interface HeroContentProps {
  className?: string;
  children: React.ReactNode;
}

interface HeroLogoProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

interface HeroHeadingProps {
  className?: string;
  children: React.ReactNode;
}

interface HeroDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

interface HeroActionsProps {
  className?: string;
  children: React.ReactNode;
  id?: string;
}

interface HeroMascotProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Hero - Main hero container with gradient background and solar glow overlay
 * Implements Requirements 1.4, 2.1, 2.4 from the UI/UX improvements spec
 */
const Hero = React.forwardRef<HTMLElement, HeroProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <main
        ref={ref}
        className={cn(
          // Base layout
          "min-h-screen relative overflow-hidden",
          // Gradient background (ocean-900 to neutral-900)
          "bg-gradient-to-br from-ocean-900 via-ocean-800 to-neutral-900",
          className
        )}
        {...props}
      >
        {/* Solar glow overlay effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-solar-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-solar-600/10 rounded-full blur-3xl" />
        
        {/* Content container with z-index to appear above overlay */}
        <div className="relative z-10">
          {children}
        </div>
      </main>
    );
  }
);
Hero.displayName = "Hero";

/**
 * HeroSection - Content section with responsive padding and centering
 */
const HeroSection = React.forwardRef<HTMLDivElement, HeroSectionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Responsive padding (py-24 md:py-32)
          "flex min-h-screen flex-col items-center justify-center px-4 py-24 md:py-32",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
HeroSection.displayName = "HeroSection";

/**
 * HeroContent - Main content container with max-width constraint
 */
const HeroContent = React.forwardRef<HTMLDivElement, HeroContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Center content with max-width constraint
          "max-w-5xl w-full flex flex-col items-center gap-8 text-center",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
HeroContent.displayName = "HeroContent";

/**
 * HeroLogo - Logo component with animation and optimized loading
 * Uses priority loading since it's above the fold
 */
const HeroLogo = React.forwardRef<HTMLDivElement, HeroLogoProps>(
  ({ src, alt, width = 240, height = 96, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-in fade-in slide-in-from-top-4 duration-1000",
          className
        )}
        {...props}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority // Above the fold, load immediately
          sizes="(max-width: 768px) 192px, 256px" // Responsive sizes
          className="w-48 md:w-64"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />
      </div>
    );
  }
);
HeroLogo.displayName = "HeroLogo";

/**
 * HeroHeading - Main heading with responsive typography
 */
const HeroHeading = React.forwardRef<HTMLHeadingElement, HeroHeadingProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h1
        ref={ref}
        className={cn(
          "text-4xl md:text-5xl lg:text-6xl font-bold text-white",
          "animate-in fade-in slide-in-from-top-4 duration-1000 delay-150",
          className
        )}
        {...props}
      >
        {children}
      </h1>
    );
  }
);
HeroHeading.displayName = "HeroHeading";

/**
 * HeroDescription - Description text with responsive typography
 */
const HeroDescription = React.forwardRef<HTMLParagraphElement, HeroDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(
          "text-lg md:text-xl text-neutral-300 max-w-2xl",
          "animate-in fade-in slide-in-from-top-4 duration-1000 delay-300",
          className
        )}
        {...props}
      >
        {children}
      </p>
    );
  }
);
HeroDescription.displayName = "HeroDescription";

/**
 * HeroActions - Action buttons container
 */
const HeroActions = React.forwardRef<HTMLDivElement, HeroActionsProps>(
  ({ className, children, id, ...props }, ref) => {
    return (
      <div
        ref={ref}
        id={id}
        className={cn(
          "flex flex-col sm:flex-row gap-4 w-full sm:w-auto",
          "animate-in fade-in slide-in-from-top-4 duration-1000 delay-450",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
HeroActions.displayName = "HeroActions";

/**
 * HeroMascot - Integrated mascot component for hero composition
 * Positioned as part of the hero layout, not floating
 */
const HeroMascot = React.forwardRef<HTMLDivElement, HeroMascotProps>(
  ({ src, alt, width = 200, height = 200, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "hidden lg:block absolute bottom-0 right-8 xl:right-16",
          "animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700",
          className
        )}
        {...props}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy" // Lazy load since it's decorative
          sizes="(min-width: 1280px) 240px, 200px" // Responsive sizes
          className="drop-shadow-2xl animate-float w-48 xl:w-60"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />
      </div>
    );
  }
);
HeroMascot.displayName = "HeroMascot";

export {
  Hero,
  HeroSection,
  HeroContent,
  HeroLogo,
  HeroHeading,
  HeroDescription,
  HeroActions,
  HeroMascot,
};