/**
 * Page Transition Components
 * 
 * Provides smooth page transitions and animations using Framer Motion.
 * Includes fade-in animations for page loads and slide animations for wizard steps.
 * 
 * Requirements: 8.2, 8.5
 */

'use client';

import React from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Common animation variants
 */
const fadeInVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const slideDownVariants: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

const slideLeftVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const slideRightVariants: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

/**
 * Transition timing configurations
 */
const transitionConfig = {
  // Standard 300ms duration as specified
  default: {
    duration: 0.3,
    ease: 'easeInOut' as const,
  },
  
  // Fast transitions for micro-interactions
  fast: {
    duration: 0.15,
    ease: 'easeInOut' as const,
  },
  
  // Slow transitions for dramatic effects
  slow: {
    duration: 0.5,
    ease: 'easeInOut' as const,
  },
  
  // Spring animation for bouncy effects
  spring: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  },
  
  // Gentle spring for subtle effects
  gentleSpring: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 25,
  },
};

/**
 * Get animation variants by name
 */
const getVariants = (variant: PageTransitionProps['variant']): Variants => {
  switch (variant) {
    case 'slideUp':
      return slideUpVariants;
    case 'slideDown':
      return slideDownVariants;
    case 'slideLeft':
      return slideLeftVariants;
    case 'slideRight':
      return slideRightVariants;
    case 'scale':
      return scaleVariants;
    case 'fadeIn':
    default:
      return fadeInVariants;
  }
};

export interface PageTransitionProps {
  /**
   * Animation variant to use
   */
  variant?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale';
  /**
   * Transition timing configuration
   */
  timing?: keyof typeof transitionConfig;
  /**
   * Custom transition override
   */
  transition?: any;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Children to animate
   */
  children: React.ReactNode;
  /**
   * Unique key for AnimatePresence
   */
  animationKey?: string;
}

/**
 * Main page transition wrapper
 */
const PageTransition = React.forwardRef<HTMLDivElement, PageTransitionProps>(
  ({ 
    variant = 'fadeIn', 
    timing = 'default', 
    transition, 
    className, 
    children, 
    animationKey,
    ...props 
  }, ref) => {
    const animationVariant = getVariants(variant);
    const transitionSettings = transition || transitionConfig[timing];

    return (
      <motion.div
        ref={ref}
        key={animationKey}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={animationVariant}
        transition={transitionSettings}
        className={cn('w-full', className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

PageTransition.displayName = 'PageTransition';

/**
 * Animated page wrapper with AnimatePresence
 */
export interface AnimatedPageProps extends PageTransitionProps {
  /**
   * Whether to show the page (for conditional rendering)
   */
  show?: boolean;
  /**
   * Mode for AnimatePresence
   */
  mode?: 'wait' | 'sync' | 'popLayout';
}

const AnimatedPage = React.forwardRef<HTMLDivElement, AnimatedPageProps>(
  ({ show = true, mode = 'wait', animationKey, children, ...transitionProps }, ref) => {
    return (
      <AnimatePresence mode={mode}>
        {show && (
          <PageTransition
            ref={ref}
            animationKey={animationKey}
            {...transitionProps}
          >
            {children}
          </PageTransition>
        )}
      </AnimatePresence>
    );
  }
);

AnimatedPage.displayName = 'AnimatedPage';

/**
 * Wizard step transition component
 */
export interface WizardStepTransitionProps {
  /**
   * Current step number
   */
  currentStep: number;
  /**
   * Direction of transition ('forward' | 'backward')
   */
  direction?: 'forward' | 'backward';
  /**
   * Children to animate
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const WizardStepTransition = React.forwardRef<HTMLDivElement, WizardStepTransitionProps>(
  ({ currentStep, direction = 'forward', children, className }, ref) => {
    const variant = direction === 'forward' ? 'slideLeft' : 'slideRight';
    
    return (
      <AnimatePresence mode="wait">
        <PageTransition
          ref={ref}
          key={currentStep}
          variant={variant}
          timing="default"
          className={className}
        >
          {children}
        </PageTransition>
      </AnimatePresence>
    );
  }
);

WizardStepTransition.displayName = 'WizardStepTransition';

/**
 * Staggered children animation
 */
export interface StaggeredAnimationProps {
  /**
   * Children to animate
   */
  children: React.ReactNode;
  /**
   * Stagger delay between children (in seconds)
   */
  staggerDelay?: number;
  /**
   * Animation variant for children
   */
  variant?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale';
  /**
   * Additional CSS classes
   */
  className?: string;
}

const StaggeredAnimation = React.forwardRef<HTMLDivElement, StaggeredAnimationProps>(
  ({ children, staggerDelay = 0.1, variant = 'slideUp', className }, ref) => {
    const containerVariants: Variants = {
      initial: {},
      animate: {
        transition: {
          staggerChildren: staggerDelay,
        },
      },
    };

    const childVariants = getVariants(variant);

    return (
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className={className}
      >
        {React.Children.map(children, (child, index) => (
          <motion.div key={index} variants={childVariants}>
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }
);

StaggeredAnimation.displayName = 'StaggeredAnimation';

/**
 * Route transition wrapper for Next.js pages
 */
export interface RouteTransitionProps extends PageTransitionProps {
  /**
   * Route key (usually pathname)
   */
  routeKey: string;
}

const RouteTransition = React.forwardRef<HTMLDivElement, RouteTransitionProps>(
  ({ routeKey, ...transitionProps }, ref) => {
    return (
      <AnimatePresence mode="wait">
        <PageTransition
          ref={ref}
          animationKey={routeKey}
          {...transitionProps}
        />
      </AnimatePresence>
    );
  }
);

RouteTransition.displayName = 'RouteTransition';

/**
 * Modal/Dialog transition
 */
export interface ModalTransitionProps {
  /**
   * Whether modal is open
   */
  isOpen: boolean;
  /**
   * Children to animate
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Backdrop click handler
   */
  onBackdropClick?: () => void;
}

const ModalTransition = React.forwardRef<HTMLDivElement, ModalTransitionProps>(
  ({ isOpen, children, className, onBackdropClick }, ref) => {
    const backdropVariants: Variants = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };

    const modalVariants: Variants = {
      initial: { opacity: 0, scale: 0.95, y: 20 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95, y: 20 },
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={ref}
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onBackdropClick}
          >
            <motion.div
              variants={modalVariants}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={cn('relative', className)}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

ModalTransition.displayName = 'ModalTransition';

/**
 * Loading transition for async content
 */
export interface LoadingTransitionProps {
  /**
   * Whether content is loading
   */
  isLoading: boolean;
  /**
   * Loading component
   */
  loadingComponent: React.ReactNode;
  /**
   * Content to show when loaded
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const LoadingTransition = React.forwardRef<HTMLDivElement, LoadingTransitionProps>(
  ({ isLoading, loadingComponent, children, className }, ref) => {
    return (
      <div ref={ref} className={className}>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <PageTransition
              key="loading"
              variant="fadeIn"
              timing="fast"
            >
              {loadingComponent}
            </PageTransition>
          ) : (
            <PageTransition
              key="content"
              variant="fadeIn"
              timing="default"
            >
              {children}
            </PageTransition>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

LoadingTransition.displayName = 'LoadingTransition';

export {
  PageTransition,
  AnimatedPage,
  WizardStepTransition,
  StaggeredAnimation,
  RouteTransition,
  ModalTransition,
  LoadingTransition,
  transitionConfig,
};