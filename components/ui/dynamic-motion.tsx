/**
 * Dynamic Motion Components
 * Lazy loads Framer Motion for non-critical animations to reduce initial bundle size
 */

import React from 'react';
import { cn } from '@/lib/utils';

// Fallback component for when motion is loading
const MotionFallback: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
}> = ({ children, className }) => (
  <div className={cn(className)}>
    {children}
  </div>
);

// Dynamic motion div component
export const DynamicMotionDiv = React.lazy(async () => {
  const { motion } = await import('framer-motion');
  return { default: motion.div };
});

// Dynamic AnimatePresence component
export const DynamicAnimatePresence = React.lazy(async () => {
  const { AnimatePresence } = await import('framer-motion');
  return { default: AnimatePresence };
});

// Wrapper component with Suspense
export const LazyMotionDiv: React.FC<{
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}> = ({ children, className, ...props }) => (
  <React.Suspense fallback={<MotionFallback className={className}>{children}</MotionFallback>}>
    <DynamicMotionDiv className={className} {...props}>
      {children}
    </DynamicMotionDiv>
  </React.Suspense>
);

// Wrapper for AnimatePresence with Suspense
export const LazyAnimatePresence: React.FC<{
  children: React.ReactNode;
  [key: string]: any;
}> = ({ children, ...props }) => (
  <React.Suspense fallback={<>{children}</>}>
    <DynamicAnimatePresence {...props}>
      {children}
    </DynamicAnimatePresence>
  </React.Suspense>
);