/**
 * Enhanced Button Demo Component
 * Showcases all button variants, sizes, and states
 * Validates: Requirements 1.1, 1.3, 11.1, 11.2, 11.4
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Save, 
  Send, 
  Settings, 
  Heart, 
  Star, 
  Plus,
  ArrowRight,
  Check,
  X
} from 'lucide-react';

export function EnhancedButtonDemo() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const toggleLoading = (key: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    // Auto-reset loading state after 3 seconds
    setTimeout(() => {
      setLoadingStates(prev => ({
        ...prev,
        [key]: false
      }));
    }, 3000);
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-neutral-900">
          Enhanced Button Component
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Premium button component with solar gradient, multiple variants, loading states, 
          and comprehensive accessibility features.
        </p>
      </div>

      {/* Button Variants */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-neutral-900 mb-2">
            Button Variants
          </h2>
          <p className="text-neutral-600">
            Four distinct variants with premium styling and brand alignment
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Primary Variant */}
          <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 text-center space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Primary</h3>
            <p className="text-sm text-neutral-600">
              Solar gradient with premium shadows
            </p>
            <div className="space-y-3">
              <Button variant="primary" className="w-full">
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button variant="primary" className="w-full" disabled>
                Disabled
              </Button>
            </div>
          </div>

          {/* Secondary Variant */}
          <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 text-center space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Secondary</h3>
            <p className="text-sm text-neutral-600">
              Professional ocean blue
            </p>
            <div className="space-y-3">
              <Button variant="secondary" className="w-full">
                <Save className="w-4 h-4" />
                Save
              </Button>
              <Button variant="secondary" className="w-full" disabled>
                Disabled
              </Button>
            </div>
          </div>

          {/* Outline Variant */}
          <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 text-center space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Outline</h3>
            <p className="text-sm text-neutral-600">
              Subtle with solar accent
            </p>
            <div className="space-y-3">
              <Button variant="outline" className="w-full">
                <Send className="w-4 h-4" />
                Send
              </Button>
              <Button variant="outline" className="w-full" disabled>
                Disabled
              </Button>
            </div>
          </div>

          {/* Ghost Variant */}
          <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 text-center space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Ghost</h3>
            <p className="text-sm text-neutral-600">
              Minimal with hover effects
            </p>
            <div className="space-y-3">
              <Button variant="ghost" className="w-full">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
              <Button variant="ghost" className="w-full" disabled>
                Disabled
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Button Sizes */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-neutral-900 mb-2">
            Button Sizes
          </h2>
          <p className="text-neutral-600">
            Four sizes with proper touch targets and accessibility
          </p>
        </div>

        <div className="bg-white border-2 border-neutral-200 rounded-xl p-8">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="sm" variant="primary">
              <Heart className="w-3 h-3" />
              Small
            </Button>
            <Button size="default" variant="primary">
              <Star className="w-4 h-4" />
              Default
            </Button>
            <Button size="lg" variant="primary">
              <Plus className="w-5 h-5" />
              Large
            </Button>
            <Button size="xl" variant="primary">
              <ArrowRight className="w-6 h-6" />
              Extra Large
            </Button>
          </div>
        </div>
      </section>

      {/* Loading States */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-neutral-900 mb-2">
            Loading States
          </h2>
          <p className="text-neutral-600">
            Interactive loading states with spinners and custom text
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Primary Loading */}
          <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 text-center space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Primary</h3>
            <div className="space-y-3">
              <Button 
                variant="primary" 
                className="w-full"
                loading={loadingStates.primary}
                onClick={() => toggleLoading('primary')}
              >
                Process Payment
              </Button>
              <Button 
                variant="primary" 
                className="w-full"
                loading={loadingStates.primaryCustom}
                loadingText="Processing..."
                onClick={() => toggleLoading('primaryCustom')}
              >
                Custom Loading Text
              </Button>
            </div>
          </div>

          {/* Secondary Loading */}
          <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 text-center space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Secondary</h3>
            <div className="space-y-3">
              <Button 
                variant="secondary" 
                className="w-full"
                loading={loadingStates.secondary}
                onClick={() => toggleLoading('secondary')}
              >
                Upload File
              </Button>
              <Button 
                variant="secondary" 
                className="w-full"
                loading={loadingStates.secondaryCustom}
                loadingText="Uploading..."
                onClick={() => toggleLoading('secondaryCustom')}
              >
                Custom Loading Text
              </Button>
            </div>
          </div>

          {/* Outline Loading */}
          <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 text-center space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Outline</h3>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                loading={loadingStates.outline}
                onClick={() => toggleLoading('outline')}
              >
                Send Email
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                loading={loadingStates.outlineCustom}
                loadingText="Sending..."
                onClick={() => toggleLoading('outlineCustom')}
              >
                Custom Loading Text
              </Button>
            </div>
          </div>

          {/* Ghost Loading */}
          <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 text-center space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Ghost</h3>
            <div className="space-y-3">
              <Button 
                variant="ghost" 
                className="w-full"
                loading={loadingStates.ghost}
                onClick={() => toggleLoading('ghost')}
              >
                Refresh Data
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                loading={loadingStates.ghostCustom}
                loadingText="Refreshing..."
                onClick={() => toggleLoading('ghostCustom')}
              >
                Custom Loading Text
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Examples */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-neutral-900 mb-2">
            Interactive Examples
          </h2>
          <p className="text-neutral-600">
            Real-world usage examples with icons and actions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Action Buttons */}
          <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Action Buttons</h3>
            <div className="space-y-3">
              <Button variant="primary" className="w-full">
                <Check className="w-4 h-4" />
                Approve Contract
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="secondary" className="w-full">
                <Save className="w-4 h-4" />
                Save Draft
              </Button>
              <Button variant="outline" className="w-full">
                <Send className="w-4 h-4" />
                Send for Review
              </Button>
              <Button variant="ghost" className="w-full">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </div>

          {/* Size Variations */}
          <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Size Variations</h3>
            <div className="space-y-3">
              <Button size="xl" variant="primary" className="w-full">
                <Download className="w-6 h-6" />
                Download Contract (XL)
              </Button>
              <Button size="lg" variant="secondary" className="w-full">
                <Save className="w-5 h-5" />
                Save Changes (Large)
              </Button>
              <Button size="default" variant="outline" className="w-full">
                <Send className="w-4 h-4" />
                Send Email (Default)
              </Button>
              <Button size="sm" variant="ghost" className="w-full">
                <Settings className="w-3 h-3" />
                Settings (Small)
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Accessibility Features */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-neutral-900 mb-2">
            Accessibility Features
          </h2>
          <p className="text-neutral-600">
            Focus management, keyboard navigation, and screen reader support
          </p>
        </div>

        <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 space-y-4">
          <p className="text-sm text-neutral-600 mb-4">
            Try tabbing through these buttons to see focus management in action:
          </p>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">
              Tab Order 1
            </Button>
            <Button variant="secondary">
              Tab Order 2
            </Button>
            <Button variant="outline">
              Tab Order 3
            </Button>
            <Button variant="ghost">
              Tab Order 4
            </Button>
            <Button variant="primary" disabled>
              Disabled (Skipped)
            </Button>
            <Button variant="secondary" loading>
              Loading (Disabled)
            </Button>
          </div>
        </div>
      </section>

      {/* Usage Guidelines */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-neutral-900 mb-2">
            Usage Guidelines
          </h2>
          <p className="text-neutral-600">
            Best practices for using the enhanced button component
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-energy-600">✓ Do</h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>• Use primary variant for main actions</li>
              <li>• Use secondary for supporting actions</li>
              <li>• Use outline for subtle actions</li>
              <li>• Use ghost for minimal actions</li>
              <li>• Include loading states for async actions</li>
              <li>• Use appropriate sizes for context</li>
              <li>• Include icons for better UX</li>
            </ul>
          </div>

          <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-red-600">✗ Don't</h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>• Use multiple primary buttons in one view</li>
              <li>• Mix different button styles inconsistently</li>
              <li>• Forget to handle loading states</li>
              <li>• Use buttons smaller than 44px on mobile</li>
              <li>• Override disabled states</li>
              <li>• Use buttons without clear labels</li>
              <li>• Ignore keyboard accessibility</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}