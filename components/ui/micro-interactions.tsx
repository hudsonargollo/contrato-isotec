/**
 * Micro-Interaction Components
 * 
 * Provides smooth micro-interactions for UI elements including button press animations,
 * card hover effects, input focus animations, and icon bounce animations.
 * 
 * Requirements: 1.3, 11.1, 11.6
 */

'use client';

import React from 'react';
import { motion, type MotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Common micro-interaction variants
 */
const microInteractionVariants = {
  // Button press animation (scale: 0.95)
  buttonPress: {
    whileTap: { scale: 0.95 },
    transition: { duration: 0.1, ease: 'easeOut' },
  },
  
  // Card hover animation (scale: 1.02, y: -4)
  cardHover: {
    whileHover: { 
      scale: 1.02, 
      y: -4,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    whileTap: { 
      scale: 0.98,
      transition: { duration: 0.1, ease: 'easeOut' }
    },
  },
  
  // Input focus animation
  inputFocus: {
    whileFocus: { 
      scale: 1.01,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
  },
  
  // Icon bounce animation
  iconBounce: {
    animate: { 
      y: [0, -4, 0],
      transition: { 
        duration: 0.6, 
        repeat: Infinity, 
        repeatDelay: 2,
        ease: 'easeInOut'
      }
    },
  },
  
  // Gentle hover lift
  gentleHover: {
    whileHover: { 
      y: -2,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
  },
  
  // Pulse animation
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    },
  },
  
  // Wiggle animation
  wiggle: {
    animate: {
      rotate: [0, -3, 3, -3, 3, 0],
      transition: {
        duration: 0.5,
        ease: 'easeInOut'
      }
    },
  },
  
  // Glow effect
  glow: {
    whileHover: {
      boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
      transition: { duration: 0.3, ease: 'easeOut' }
    },
  },
  
  // Scale on hover
  scaleHover: {
    whileHover: { 
      scale: 1.05,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    whileTap: { 
      scale: 0.95,
      transition: { duration: 0.1, ease: 'easeOut' }
    },
  },
};

/**
 * Interactive Button with press animation
 */
export interface InteractiveButtonProps extends MotionProps {
  /**
   * Button content
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to disable interactions
   */
  disabled?: boolean;
  /**
   * Click handler
   */
  onClick?: () => void;
}

const InteractiveButton = React.forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  ({ children, className, disabled = false, onClick, ...motionProps }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg px-4 py-2',
          'bg-solar-500 text-white font-medium',
          'hover:bg-solar-600 focus:outline-none focus:ring-2 focus:ring-solar-500/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-200',
          className
        )}
        disabled={disabled}
        onClick={onClick}
        whileTap={disabled ? undefined : { scale: 0.95 }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
        {...motionProps}
      >
        {children}
      </motion.button>
    );
  }
);

InteractiveButton.displayName = 'InteractiveButton';

/**
 * Interactive Card with hover animation
 */
export interface InteractiveCardProps extends MotionProps {
  /**
   * Card content
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether the card is clickable
   */
  clickable?: boolean;
  /**
   * Click handler
   */
  onClick?: () => void;
}

const InteractiveCard = React.forwardRef<HTMLDivElement, InteractiveCardProps>(
  ({ children, className, clickable = false, onClick, ...motionProps }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'bg-white border border-neutral-200 rounded-xl p-6 shadow-sm',
          'transition-all duration-200',
          clickable && 'cursor-pointer hover:border-neutral-300',
          className
        )}
        onClick={onClick}
        whileHover={clickable ? { scale: 1.02, y: -4 } : undefined}
        whileTap={clickable ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);

InteractiveCard.displayName = 'InteractiveCard';

/**
 * Interactive Input with focus animation
 */
export interface InteractiveInputProps extends Omit<MotionProps, 'onChange'> {
  /**
   * Input type
   */
  type?: string;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Input value
   */
  value?: string;
  /**
   * Change handler
   */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether input is disabled
   */
  disabled?: boolean;
  /**
   * Whether input has error
   */
  error?: boolean;
}

const InteractiveInput = React.forwardRef<HTMLInputElement, InteractiveInputProps>(
  ({ 
    type = 'text', 
    placeholder, 
    value, 
    onChange, 
    className, 
    disabled = false, 
    error = false,
    ...motionProps 
  }, ref) => {
    return (
      <motion.input
        ref={ref}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-3 border-2 rounded-lg',
          'bg-white text-neutral-900 placeholder:text-neutral-400',
          'transition-all duration-200',
          'focus:outline-none focus:ring-4',
          error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
            : 'border-neutral-200 focus:border-solar-500 focus:ring-solar-500/10',
          disabled && 'bg-neutral-50 text-neutral-400 cursor-not-allowed',
          className
        )}
        whileFocus={{ scale: 1.01 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        {...motionProps}
      />
    );
  }
);

InteractiveInput.displayName = 'InteractiveInput';

/**
 * Bouncing Icon component
 */
export interface BouncingIconProps extends MotionProps {
  /**
   * Icon component or element
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to enable bounce animation
   */
  bounce?: boolean;
  /**
   * Bounce delay in seconds
   */
  bounceDelay?: number;
}

const BouncingIcon = React.forwardRef<HTMLDivElement, BouncingIconProps>(
  ({ children, className, bounce = true, bounceDelay = 2, ...motionProps }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn('inline-block', className)}
        animate={bounce ? { 
          y: [0, -4, 0],
        } : undefined}
        transition={bounce ? {
          duration: 0.6,
          repeat: Infinity,
          repeatDelay: bounceDelay,
          ease: 'easeInOut'
        } : undefined}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);

BouncingIcon.displayName = 'BouncingIcon';

/**
 * Hover Lift component for general use
 */
export interface HoverLiftProps extends MotionProps {
  /**
   * Content to animate
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Lift distance in pixels
   */
  liftDistance?: number;
  /**
   * Scale factor on hover
   */
  scaleOnHover?: number;
}

const HoverLift = React.forwardRef<HTMLDivElement, HoverLiftProps>(
  ({ 
    children, 
    className, 
    liftDistance = 4, 
    scaleOnHover = 1.02,
    ...motionProps 
  }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn('transition-all duration-200', className)}
        whileHover={{ 
          y: -liftDistance,
          scale: scaleOnHover,
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);

HoverLift.displayName = 'HoverLift';

/**
 * Pulsing element for attention
 */
export interface PulsingElementProps extends MotionProps {
  /**
   * Content to animate
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to enable pulse
   */
  pulse?: boolean;
  /**
   * Pulse duration in seconds
   */
  pulseDuration?: number;
}

const PulsingElement = React.forwardRef<HTMLDivElement, PulsingElementProps>(
  ({ children, className, pulse = true, pulseDuration = 2, ...motionProps }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={className}
        animate={pulse ? {
          scale: [1, 1.05, 1],
        } : undefined}
        transition={pulse ? {
          duration: pulseDuration,
          repeat: Infinity,
          ease: 'easeInOut'
        } : undefined}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);

PulsingElement.displayName = 'PulsingElement';

/**
 * Wiggle animation component
 */
export interface WiggleElementProps extends MotionProps {
  /**
   * Content to animate
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Trigger wiggle animation
   */
  trigger?: boolean;
}

const WiggleElement = React.forwardRef<HTMLDivElement, WiggleElementProps>(
  ({ children, className, trigger = false, ...motionProps }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={className}
        animate={trigger ? {
          rotate: [0, -3, 3, -3, 3, 0],
        } : undefined}
        transition={{
          duration: 0.5,
          ease: 'easeInOut'
        }}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);

WiggleElement.displayName = 'WiggleElement';

/**
 * Success animation component
 */
export interface SuccessAnimationProps extends MotionProps {
  /**
   * Content to animate
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to show success animation
   */
  showSuccess?: boolean;
}

const SuccessAnimation = React.forwardRef<HTMLDivElement, SuccessAnimationProps>(
  ({ children, className, showSuccess = false, ...motionProps }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={className}
        animate={showSuccess ? {
          scale: [0.8, 1.1, 1],
          opacity: [0, 1, 1],
        } : undefined}
        transition={{
          duration: 0.8,
          ease: 'easeOut'
        }}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);

SuccessAnimation.displayName = 'SuccessAnimation';

export {
  InteractiveButton,
  InteractiveCard,
  InteractiveInput,
  BouncingIcon,
  HoverLift,
  PulsingElement,
  WiggleElement,
  SuccessAnimation,
  microInteractionVariants,
};