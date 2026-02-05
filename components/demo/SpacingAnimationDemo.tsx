/**
 * Spacing and Animation Demo Component
 * 
 * Demonstrates the spacing scale and animation utilities from the design system.
 * This component showcases the 4px base unit spacing and various animations.
 */

'use client';

import React, { useState } from 'react';
import { SPACING, ANIMATION_CLASSES, withHover, withFocus, withActive } from '@/lib/design-system';

export function SpacingAnimationDemo() {
  const [activeAnimation, setActiveAnimation] = useState<string | null>(null);

  const spacingExamples = [
    { key: 1, label: '1 (4px)', value: SPACING[1] },
    { key: 2, label: '2 (8px)', value: SPACING[2] },
    { key: 4, label: '4 (16px)', value: SPACING[4] },
    { key: 6, label: '6 (24px)', value: SPACING[6] },
    { key: 8, label: '8 (32px)', value: SPACING[8] },
    { key: 12, label: '12 (48px)', value: SPACING[12] },
    { key: 16, label: '16 (64px)', value: SPACING[16] },
    { key: 24, label: '24 (96px)', value: SPACING[24] },
  ];

  const animationExamples = [
    { key: 'fadeIn', label: 'Fade In', class: ANIMATION_CLASSES.fadeIn },
    { key: 'slideUp', label: 'Slide Up', class: ANIMATION_CLASSES.slideUp },
    { key: 'bounceGentle', label: 'Bounce Gentle', class: ANIMATION_CLASSES.bounceGentle },
    { key: 'scaleIn', label: 'Scale In', class: ANIMATION_CLASSES.scaleIn },
    { key: 'wiggle', label: 'Wiggle', class: ANIMATION_CLASSES.wiggle },
    { key: 'pulse', label: 'Pulse', class: ANIMATION_CLASSES.pulse },
    { key: 'float', label: 'Float', class: ANIMATION_CLASSES.float },
  ];

  const triggerAnimation = (animationKey: string) => {
    setActiveAnimation(animationKey);
    setTimeout(() => setActiveAnimation(null), 1000);
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-neutral-900">
          Design System Demo
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Showcasing the 4px base unit spacing system and animation utilities 
          for the ISOTEC Photovoltaic Contract System.
        </p>
      </div>

      {/* Spacing System Demo */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-neutral-900 mb-2">
            Spacing System
          </h2>
          <p className="text-neutral-600">
            Based on 4px base unit for consistent spacing throughout the application
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {spacingExamples.map(({ key, label, value }) => (
            <div
              key={key}
              className="bg-white border-2 border-neutral-200 rounded-xl p-6 text-center space-y-4"
            >
              <div className="text-sm font-medium text-neutral-700">
                Spacing {label}
              </div>
              <div 
                className="bg-solar-500 rounded"
                style={{ height: value, width: '100%' }}
              />
              <div className="text-xs text-neutral-500">
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Animation System Demo */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-neutral-900 mb-2">
            Animation System
          </h2>
          <p className="text-neutral-600">
            Smooth, performant animations with consistent timing and easing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {animationExamples.map(({ key, label, class: animationClass }) => (
            <div
              key={key}
              className="bg-white border-2 border-neutral-200 rounded-xl p-6 text-center space-y-4"
            >
              <div className="text-sm font-medium text-neutral-700">
                {label}
              </div>
              <div className="flex justify-center">
                <div
                  className={`w-16 h-16 bg-gradient-to-r from-solar-500 to-solar-600 rounded-lg ${
                    activeAnimation === key ? animationClass : ''
                  }`}
                />
              </div>
              <button
                onClick={() => triggerAnimation(key)}
                className={withHover(
                  'px-4 py-2 bg-ocean-500 text-white rounded-lg text-sm font-medium',
                  'hover:bg-ocean-600'
                )}
              >
                Trigger
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Elements Demo */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-neutral-900 mb-2">
            Interactive Elements
          </h2>
          <p className="text-neutral-600">
            Hover, focus, and active states with smooth transitions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Hover Effect */}
          <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 text-center space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Hover Effect</h3>
            <div
              className={withHover(
                'w-24 h-24 bg-solar-500 rounded-xl mx-auto cursor-pointer',
                'hover:bg-solar-600 hover:scale-105 hover:shadow-lg'
              )}
            />
            <p className="text-sm text-neutral-600">Hover over the square</p>
          </div>

          {/* Focus Effect */}
          <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 text-center space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Focus Effect</h3>
            <input
              type="text"
              placeholder="Click to focus"
              className={withFocus(
                'w-full px-4 py-3 border-2 border-neutral-300 rounded-lg text-center',
                'focus:border-solar-500 focus:ring-4 focus:ring-solar-500/20 focus:outline-none'
              )}
            />
            <p className="text-sm text-neutral-600">Click the input field</p>
          </div>

          {/* Active Effect */}
          <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 text-center space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Active Effect</h3>
            <button
              className={withActive(
                'px-6 py-3 bg-energy-500 text-white rounded-lg font-medium',
                'active:scale-95 active:bg-energy-600'
              )}
            >
              Press Me
            </button>
            <p className="text-sm text-neutral-600">Click and hold the button</p>
          </div>
        </div>
      </section>

      {/* Touch Target Demo */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-neutral-900 mb-2">
            Touch Targets
          </h2>
          <p className="text-neutral-600">
            Accessibility-compliant touch targets (minimum 44x44px)
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          <div className="text-center space-y-2">
            <div className="text-sm font-medium text-neutral-700">Minimum (44px)</div>
            <button
              className="w-11 h-11 bg-solar-500 hover:bg-solar-600 rounded-lg transition-colors duration-200"
              style={{ minWidth: '44px', minHeight: '44px' }}
            />
          </div>
          <div className="text-center space-y-2">
            <div className="text-sm font-medium text-neutral-700">Comfortable (48px)</div>
            <button
              className="w-12 h-12 bg-ocean-500 hover:bg-ocean-600 rounded-lg transition-colors duration-200"
              style={{ minWidth: '48px', minHeight: '48px' }}
            />
          </div>
          <div className="text-center space-y-2">
            <div className="text-sm font-medium text-neutral-700">Large (56px)</div>
            <button
              className="w-14 h-14 bg-energy-500 hover:bg-energy-600 rounded-lg transition-colors duration-200"
              style={{ minWidth: '56px', minHeight: '56px' }}
            />
          </div>
        </div>
      </section>

      {/* Loading States Demo */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-neutral-900 mb-2">
            Loading States
          </h2>
          <p className="text-neutral-600">
            Various loading indicators and skeleton screens
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Spinner */}
          <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 text-center space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Spinner</h3>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-3 border-solar-200 border-t-solar-500 rounded-full animate-spin" />
            </div>
          </div>

          {/* Pulse */}
          <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 text-center space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Pulse</h3>
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-solar-500 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Skeleton */}
          <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 text-center space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Skeleton</h3>
            <div className="space-y-2">
              <div className="h-4 bg-neutral-200 rounded animate-pulse" />
              <div className="h-4 bg-neutral-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-neutral-200 rounded animate-pulse w-1/2" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center pt-8 border-t border-neutral-200">
        <p className="text-neutral-600">
          Design system utilities implemented with Tailwind CSS and custom animations
        </p>
      </div>
    </div>
  );
}

export default SpacingAnimationDemo;