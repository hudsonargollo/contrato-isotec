'use client';

/**
 * Responsive Wizard Progress Indicator Component
 * 
 * Features:
 * - Desktop version with step labels and descriptions
 * - Mobile compact version with numbers only
 * - Progress bar with gradient fill
 * - Smooth animations for progress updates
 * - Premium design with ISOTEC branding
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WizardStep {
  id: number;
  title: string;
  description: string;
}

interface WizardProgressProps {
  steps: readonly WizardStep[];
  currentStep: number;
  className?: string;
}

export function WizardProgress({ steps, currentStep, className }: WizardProgressProps) {
  // Calculate progress percentage
  const progressPercentage = (currentStep / steps.length) * 100;

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop Progress Indicator - Full labels and descriptions */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step Circle and Label */}
              <div className="flex flex-col items-center relative">
                {/* Step Circle */}
                <motion.div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm',
                    'transition-all duration-500 ease-out relative z-10',
                    {
                      // Completed step
                      'bg-gradient-to-r from-solar-500 to-solar-600 text-neutral-900 shadow-lg shadow-solar-500/30': 
                        currentStep > step.id,
                      // Current step
                      'bg-gradient-to-r from-solar-500 to-solar-600 text-neutral-900 ring-4 ring-solar-500/20 shadow-xl shadow-solar-500/50 scale-110': 
                        currentStep === step.id,
                      // Future step
                      'bg-neutral-700 text-neutral-400 border-2 border-neutral-600': 
                        currentStep < step.id,
                    }
                  )}
                  initial={false}
                  animate={{
                    scale: currentStep === step.id ? 1.1 : 1,
                    boxShadow: currentStep === step.id 
                      ? '0 20px 25px -5px rgba(245, 158, 11, 0.5), 0 10px 10px -5px rgba(245, 158, 11, 0.2)' 
                      : currentStep > step.id
                      ? '0 10px 15px -3px rgba(245, 158, 11, 0.3), 0 4px 6px -2px rgba(245, 158, 11, 0.1)'
                      : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  {currentStep > step.id ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.4, ease: 'backOut' }}
                    >
                      <Check className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.span
                      initial={false}
                      animate={{ 
                        color: currentStep >= step.id ? '#171717' : '#a3a3a3',
                        fontWeight: currentStep === step.id ? 700 : 600
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {step.id}
                    </motion.span>
                  )}
                </motion.div>

                {/* Step Label and Description */}
                <motion.div 
                  className="mt-3 text-center max-w-[120px]"
                  initial={false}
                  animate={{
                    y: currentStep === step.id ? -2 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.p 
                    className={cn(
                      'text-sm font-medium transition-colors duration-300',
                      {
                        'text-white': currentStep >= step.id,
                        'text-neutral-500': currentStep < step.id,
                      }
                    )}
                    initial={false}
                    animate={{
                      fontWeight: currentStep === step.id ? 600 : 500,
                    }}
                  >
                    {step.title}
                  </motion.p>
                  <p className="text-xs text-neutral-500 mt-1 leading-tight">
                    {step.description}
                  </p>
                </motion.div>
              </div>

              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 mx-4 relative">
                  {/* Background line */}
                  <div className="absolute inset-0 bg-neutral-700 rounded-full" />
                  
                  {/* Progress line with gradient */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-solar-500 to-solar-600 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: currentStep > step.id ? '100%' : '0%',
                    }}
                    transition={{ 
                      duration: 0.6, 
                      ease: 'easeInOut',
                      delay: currentStep > step.id ? 0.2 : 0
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Mobile Progress Indicator - Compact with numbers only */}
      <div className="block md:hidden">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Compact Step Circle */}
              <motion.div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs',
                  'transition-all duration-300 relative z-10',
                  {
                    // Completed step
                    'bg-gradient-to-r from-solar-500 to-solar-600 text-neutral-900 shadow-md shadow-solar-500/30': 
                      currentStep > step.id,
                    // Current step
                    'bg-gradient-to-r from-solar-500 to-solar-600 text-neutral-900 ring-2 ring-solar-500/30 shadow-lg shadow-solar-500/40': 
                      currentStep === step.id,
                    // Future step
                    'bg-neutral-700 text-neutral-400': 
                      currentStep < step.id,
                  }
                )}
                initial={false}
                animate={{
                  scale: currentStep === step.id ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                {currentStep > step.id ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, ease: 'backOut' }}
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                ) : (
                  step.id
                )}
              </motion.div>

              {/* Mobile Connection Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 relative">
                  <div className="absolute inset-0 bg-neutral-700 rounded-full" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-solar-500 to-solar-600 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: currentStep > step.id ? '100%' : '0%',
                    }}
                    transition={{ 
                      duration: 0.4, 
                      ease: 'easeInOut',
                      delay: currentStep > step.id ? 0.1 : 0
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Current Step Info for Mobile */}
        <motion.div 
          className="text-center"
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-white font-medium text-sm">
            {steps[currentStep - 1]?.title}
          </p>
          <p className="text-neutral-400 text-xs mt-1">
            {steps[currentStep - 1]?.description}
          </p>
        </motion.div>
      </div>

      {/* Overall Progress Bar with Gradient */}
      <motion.div 
        className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-700 mt-6"
        initial={false}
      >
        {/* Animated progress fill */}
        <motion.div
          className="h-full bg-gradient-to-r from-solar-400 via-solar-500 to-solar-600 relative"
          initial={{ width: '0%' }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ 
            duration: 0.8, 
            ease: 'easeInOut',
            delay: 0.1
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
              delay: 1,
            }}
          />
        </motion.div>

        {/* Progress percentage indicator */}
        <motion.div
          className="absolute -top-8 text-xs font-medium text-solar-400"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: progressPercentage > 0 ? 1 : 0,
            x: `${Math.max(0, Math.min(progressPercentage - 5, 90))}%`
          }}
          transition={{ duration: 0.3 }}
        >
          {Math.round(progressPercentage)}%
        </motion.div>
      </motion.div>
    </div>
  );
}