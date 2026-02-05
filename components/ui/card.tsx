/**
 * Enhanced Card Components
 * Premium container components with ISOTEC brand styling
 * 
 * Features:
 * - Base styling with enhanced borders and shadows
 * - Hover effects with smooth transitions
 * - Interactive variant with scale animation
 * - Responsive design following ISOTEC design system
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'interactive' | 'elevated' | 'outlined';
  hover?: boolean;
}

export function Card({ 
  className = '', 
  children, 
  variant = 'default',
  hover = false,
  ...props 
}: CardProps) {
  const baseClasses = [
    // Base styling with enhanced borders and shadows
    'bg-white',
    'border border-neutral-200',
    'rounded-xl',
    'shadow-sm',
    'transition-all duration-200 ease-out',
  ];

  const variantClasses = {
    default: [],
    interactive: [
      'cursor-pointer',
      'hover:shadow-md',
      'hover:border-neutral-300',
      'hover:scale-[1.02]',
      'hover:-translate-y-1',
      'active:scale-[0.98]',
      'active:translate-y-0',
    ],
    elevated: [
      'shadow-md',
      'border-neutral-300',
    ],
    outlined: [
      'border-2',
      'border-solar-200',
      'shadow-none',
      'hover:border-solar-300',
      'hover:shadow-sm',
    ],
  };

  const hoverClasses = hover ? [
    'hover:shadow-md',
    'hover:border-neutral-300',
  ] : [];

  return (
    <div
      className={cn(
        ...baseClasses,
        ...variantClasses[variant],
        ...hoverClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ 
  className = '', 
  children, 
  ...props 
}: CardProps) {
  return (
    <div 
      className={cn(
        'flex flex-col space-y-1.5 p-6',
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ 
  className = '', 
  children, 
  ...props 
}: CardProps) {
  return (
    <h3 
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight text-neutral-900',
        className
      )} 
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ 
  className = '', 
  children, 
  ...props 
}: CardProps) {
  return (
    <p 
      className={cn(
        'text-sm text-neutral-600 leading-relaxed',
        className
      )} 
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ 
  className = '', 
  children, 
  ...props 
}: CardProps) {
  return (
    <div 
      className={cn(
        'p-6 pt-0',
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ 
  className = '', 
  children, 
  ...props 
}: CardProps) {
  return (
    <div 
      className={cn(
        'flex items-center p-6 pt-0',
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}
