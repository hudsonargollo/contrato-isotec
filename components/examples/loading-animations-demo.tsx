/**
 * Loading States and Animations Demo
 * 
 * Demonstrates all the loading states and animation components implemented in task 12.
 * This file serves as both documentation and a testing playground for the components.
 */

'use client';

import React, { useState } from 'react';
import { 
  LoadingSpinner, 
  CenteredSpinner, 
  InlineSpinner, 
  LoadingOverlay 
} from '@/components/ui/loading-spinner';

import {
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonForm,
  SkeletonList,
  SkeletonAvatar,
} from '@/components/ui/skeleton';

import {
  PageTransition,
  WizardStepTransition,
  LoadingTransition,
  ModalTransition,
} from '@/components/ui/page-transitions';

import {
  InteractiveButton,
  InteractiveCard,
  InteractiveInput,
  BouncingIcon,
  HoverLift,
  PulsingElement,
  WiggleElement,
  SuccessAnimation,
} from '@/components/ui/micro-interactions';

import { Card } from '@/components/ui/card';

export default function LoadingAnimationsDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [showSuccess, setShowSuccess] = useState(false);
  const [wiggleTrigger, setWiggleTrigger] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleStepChange = (newStep: number) => {
    setDirection(newStep > currentStep ? 'forward' : 'backward');
    setCurrentStep(newStep);
  };

  const triggerSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1000);
  };

  const triggerWiggle = () => {
    setWiggleTrigger(true);
    setTimeout(() => setWiggleTrigger(false), 500);
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <PageTransition variant="fadeIn">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">
              Loading States & Animations Demo
            </h1>
            <p className="text-lg text-neutral-600">
              Comprehensive showcase of all loading and animation components
            </p>
          </div>
        </PageTransition>

        {/* Loading Spinners Section */}
        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-6 text-neutral-900">
            Loading Spinners
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Size Variants */}
            <div className="space-y-4">
              <h3 className="font-medium text-neutral-700">Size Variants</h3>
              <div className="flex items-center gap-4">
                <LoadingSpinner size="sm" />
                <LoadingSpinner size="md" />
                <LoadingSpinner size="lg" />
                <LoadingSpinner size="xl" />
              </div>
            </div>

            {/* Color Variants */}
            <div className="space-y-4">
              <h3 className="font-medium text-neutral-700">Color Variants</h3>
              <div className="flex items-center gap-4">
                <LoadingSpinner variant="solar" />
                <LoadingSpinner variant="ocean" />
                <LoadingSpinner variant="energy" />
                <LoadingSpinner variant="neutral" />
              </div>
            </div>

            {/* Centered Spinner */}
            <div className="space-y-4">
              <h3 className="font-medium text-neutral-700">Centered</h3>
              <div className="h-24 border border-neutral-200 rounded-lg relative">
                <CenteredSpinner text="Loading..." />
              </div>
            </div>

            {/* Inline Spinner */}
            <div className="space-y-4">
              <h3 className="font-medium text-neutral-700">Inline</h3>
              <div className="flex items-center gap-2">
                <span>Processing</span>
                <InlineSpinner />
              </div>
            </div>
          </div>

          {/* Loading Overlay Demo */}
          <div className="mt-8">
            <h3 className="font-medium text-neutral-700 mb-4">Loading Overlay</h3>
            <div className="relative">
              <InteractiveButton onClick={() => setShowOverlay(!showOverlay)}>
                Toggle Overlay
              </InteractiveButton>
              <div className="mt-4 h-32 bg-neutral-100 rounded-lg relative">
                <div className="p-4">
                  <p>This content can be covered by a loading overlay</p>
                </div>
                <LoadingOverlay 
                  visible={showOverlay} 
                  text="Loading overlay demo..."
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Skeleton Loaders Section */}
        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-6 text-neutral-900">
            Skeleton Loaders
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Text Skeletons */}
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-neutral-700 mb-4">Text Skeletons</h3>
                <div className="space-y-4">
                  <SkeletonText size="lg" />
                  <SkeletonText lines={3} />
                  <SkeletonText lines={2} size="sm" />
                </div>
              </div>

              {/* Avatar and List */}
              <div>
                <h3 className="font-medium text-neutral-700 mb-4">Avatar & List</h3>
                <div className="flex items-center gap-4 mb-4">
                  <SkeletonAvatar size="sm" />
                  <SkeletonAvatar size="md" />
                  <SkeletonAvatar size="lg" />
                  <SkeletonAvatar size="xl" />
                </div>
                <SkeletonList items={3} showAvatars />
              </div>
            </div>

            {/* Card and Form Skeletons */}
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-neutral-700 mb-4">Card Skeleton</h3>
                <SkeletonCard showAvatar showActions />
              </div>

              <div>
                <h3 className="font-medium text-neutral-700 mb-4">Form Skeleton</h3>
                <SkeletonForm fields={3} />
              </div>
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="mt-8">
            <h3 className="font-medium text-neutral-700 mb-4">Table Skeleton</h3>
            <SkeletonTable rows={3} columns={4} />
          </div>
        </Card>

        {/* Page Transitions Section */}
        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-6 text-neutral-900">
            Page Transitions
          </h2>
          
          {/* Loading Transition Demo */}
          <div className="mb-8">
            <h3 className="font-medium text-neutral-700 mb-4">Loading Transition</h3>
            <div className="flex gap-4 mb-4">
              <InteractiveButton onClick={() => setIsLoading(!isLoading)}>
                Toggle Loading
              </InteractiveButton>
            </div>
            <div className="border border-neutral-200 rounded-lg p-4 min-h-[200px]">
              <LoadingTransition
                isLoading={isLoading}
                loadingComponent={<CenteredSpinner text="Loading content..." />}
              >
                <div className="space-y-4">
                  <h4 className="text-lg font-medium">Loaded Content</h4>
                  <p>This content appears after loading is complete.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-solar-100 p-4 rounded-lg">
                      <h5 className="font-medium">Feature 1</h5>
                      <p className="text-sm text-neutral-600">Description here</p>
                    </div>
                    <div className="bg-ocean-100 p-4 rounded-lg">
                      <h5 className="font-medium">Feature 2</h5>
                      <p className="text-sm text-neutral-600">Description here</p>
                    </div>
                  </div>
                </div>
              </LoadingTransition>
            </div>
          </div>

          {/* Wizard Step Transition */}
          <div className="mb-8">
            <h3 className="font-medium text-neutral-700 mb-4">Wizard Step Transitions</h3>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3].map((step) => (
                <InteractiveButton
                  key={step}
                  onClick={() => handleStepChange(step)}
                  className={currentStep === step ? 'bg-solar-600' : 'bg-neutral-400'}
                >
                  Step {step}
                </InteractiveButton>
              ))}
            </div>
            <div className="border border-neutral-200 rounded-lg p-6 min-h-[150px]">
              <WizardStepTransition currentStep={currentStep} direction={direction}>
                <div className="text-center">
                  <h4 className="text-xl font-medium mb-4">Step {currentStep}</h4>
                  <p className="text-neutral-600">
                    This is the content for step {currentStep}. 
                    Notice the smooth slide transition when changing steps.
                  </p>
                </div>
              </WizardStepTransition>
            </div>
          </div>

          {/* Modal Transition */}
          <div>
            <h3 className="font-medium text-neutral-700 mb-4">Modal Transition</h3>
            <InteractiveButton onClick={() => setShowModal(true)}>
              Open Modal
            </InteractiveButton>
            <ModalTransition 
              isOpen={showModal} 
              onBackdropClick={() => setShowModal(false)}
            >
              <div className="bg-white p-8 rounded-xl shadow-xl max-w-md">
                <h4 className="text-lg font-semibold mb-4">Modal Title</h4>
                <p className="text-neutral-600 mb-6">
                  This modal appears with a smooth scale and fade animation.
                </p>
                <InteractiveButton onClick={() => setShowModal(false)}>
                  Close Modal
                </InteractiveButton>
              </div>
            </ModalTransition>
          </div>
        </Card>

        {/* Micro-Interactions Section */}
        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-6 text-neutral-900">
            Micro-Interactions
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Interactive Elements */}
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-neutral-700 mb-4">Interactive Button</h3>
                <div className="flex gap-4">
                  <InteractiveButton>Primary Action</InteractiveButton>
                  <InteractiveButton disabled>Disabled</InteractiveButton>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-neutral-700 mb-4">Interactive Input</h3>
                <div className="space-y-4">
                  <InteractiveInput 
                    placeholder="Normal input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <InteractiveInput 
                    placeholder="Error input"
                    error
                  />
                </div>
              </div>

              <div>
                <h3 className="font-medium text-neutral-700 mb-4">Interactive Cards</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InteractiveCard>
                    <h4 className="font-medium mb-2">Static Card</h4>
                    <p className="text-sm text-neutral-600">No hover effects</p>
                  </InteractiveCard>
                  <InteractiveCard clickable onClick={() => alert('Card clicked!')}>
                    <h4 className="font-medium mb-2">Clickable Card</h4>
                    <p className="text-sm text-neutral-600">Hover and click me!</p>
                  </InteractiveCard>
                </div>
              </div>
            </div>

            {/* Animation Elements */}
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-neutral-700 mb-4">Bouncing Icon</h3>
                <div className="flex items-center gap-4">
                  <BouncingIcon>
                    <span className="text-2xl">🌟</span>
                  </BouncingIcon>
                  <BouncingIcon bounce={false}>
                    <span className="text-2xl">⭐</span>
                  </BouncingIcon>
                  <span className="text-sm text-neutral-600">
                    First star bounces, second is static
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-neutral-700 mb-4">Hover Lift</h3>
                <HoverLift className="inline-block">
                  <div className="bg-gradient-to-r from-solar-400 to-solar-600 text-white p-4 rounded-lg">
                    Hover me for lift effect
                  </div>
                </HoverLift>
              </div>

              <div>
                <h3 className="font-medium text-neutral-700 mb-4">Pulsing Element</h3>
                <PulsingElement className="inline-block">
                  <div className="bg-energy-500 text-white p-4 rounded-lg">
                    I pulse gently
                  </div>
                </PulsingElement>
              </div>

              <div>
                <h3 className="font-medium text-neutral-700 mb-4">Interactive Animations</h3>
                <div className="flex gap-4">
                  <InteractiveButton onClick={triggerSuccess}>
                    Trigger Success
                  </InteractiveButton>
                  <InteractiveButton onClick={triggerWiggle}>
                    Trigger Wiggle
                  </InteractiveButton>
                </div>
                <div className="mt-4 flex gap-4">
                  <SuccessAnimation showSuccess={showSuccess}>
                    <div className="bg-energy-500 text-white p-4 rounded-lg">
                      Success Animation
                    </div>
                  </SuccessAnimation>
                  <WiggleElement trigger={wiggleTrigger}>
                    <div className="bg-ocean-500 text-white p-4 rounded-lg">
                      Wiggle Animation
                    </div>
                  </WiggleElement>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Usage Examples */}
        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-6 text-neutral-900">
            Usage Examples
          </h2>
          <div className="space-y-4 text-sm">
            <div className="bg-neutral-100 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Loading Spinner in Button:</h3>
              <code className="text-neutral-700">
                {`<InteractiveButton disabled={loading}>
  {loading ? <InlineSpinner /> : 'Submit'}
</InteractiveButton>`}
              </code>
            </div>
            
            <div className="bg-neutral-100 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Page with Loading State:</h3>
              <code className="text-neutral-700">
                {`<LoadingTransition
  isLoading={isLoading}
  loadingComponent={<SkeletonCard />}
>
  <ActualContent />
</LoadingTransition>`}
              </code>
            </div>

            <div className="bg-neutral-100 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Wizard Step Navigation:</h3>
              <code className="text-neutral-700">
                {`<WizardStepTransition 
  currentStep={step} 
  direction={direction}
>
  <StepContent />
</WizardStepTransition>`}
              </code>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}