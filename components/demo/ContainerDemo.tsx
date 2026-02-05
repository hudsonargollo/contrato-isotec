/**
 * Container Component Demo
 * Demonstrates the responsive Container component with different variants
 */

'use client';

import React from 'react';
import { Container, SectionContainer, ContentContainer, NarrowContainer } from '@/components/ui/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ContainerDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 py-8">
      {/* Header */}
      <SectionContainer>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            Container Component Demo
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Responsive containers with max-width constraints and padding for different breakpoints.
            Resize your browser to see the responsive behavior.
          </p>
        </div>
      </SectionContainer>

      {/* Basic Container Examples */}
      <SectionContainer className="mb-16">
        <h2 className="text-2xl font-semibold text-neutral-900 mb-8">Basic Container Sizes</h2>
        
        <div className="space-y-8">
          {/* Small Container */}
          <div>
            <h3 className="text-lg font-medium text-neutral-700 mb-4">Small Container (max-w-screen-sm)</h3>
            <Container size="sm" className="bg-solar-100 border-2 border-solar-200 rounded-lg">
              <Card>
                <CardHeader>
                  <CardTitle>Small Container</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600">
                    This container has a maximum width of 640px and responsive padding.
                    Perfect for narrow content like forms or focused reading.
                  </p>
                </CardContent>
              </Card>
            </Container>
          </div>

          {/* Medium Container */}
          <div>
            <h3 className="text-lg font-medium text-neutral-700 mb-4">Medium Container (max-w-screen-md)</h3>
            <Container size="md" className="bg-ocean-100 border-2 border-ocean-200 rounded-lg">
              <Card>
                <CardHeader>
                  <CardTitle>Medium Container</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600">
                    This container has a maximum width of 768px. Great for tablet-optimized layouts
                    and medium-width content sections.
                  </p>
                </CardContent>
              </Card>
            </Container>
          </div>

          {/* Large Container */}
          <div>
            <h3 className="text-lg font-medium text-neutral-700 mb-4">Large Container (max-w-screen-lg)</h3>
            <Container size="lg" className="bg-energy-100 border-2 border-energy-200 rounded-lg">
              <Card>
                <CardHeader>
                  <CardTitle>Large Container</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600">
                    This container has a maximum width of 1024px. Ideal for desktop layouts
                    and main content areas that need more space.
                  </p>
                </CardContent>
              </Card>
            </Container>
          </div>

          {/* Extra Large Container */}
          <div>
            <h3 className="text-lg font-medium text-neutral-700 mb-4">Extra Large Container (max-w-screen-xl)</h3>
            <Container size="xl" className="bg-neutral-200 border-2 border-neutral-300 rounded-lg">
              <Card>
                <CardHeader>
                  <CardTitle>Extra Large Container (Default)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600">
                    This container has a maximum width of 1280px. This is the default size,
                    perfect for wide desktop layouts and dashboard-style interfaces.
                  </p>
                </CardContent>
              </Card>
            </Container>
          </div>
        </div>
      </SectionContainer>

      {/* Padding Variants */}
      <SectionContainer className="mb-16">
        <h2 className="text-2xl font-semibold text-neutral-900 mb-8">Padding Variants</h2>
        
        <div className="space-y-8">
          {/* Small Padding */}
          <div>
            <h3 className="text-lg font-medium text-neutral-700 mb-4">Small Padding</h3>
            <Container size="lg" padding="sm" className="bg-solar-50 border border-solar-200 rounded-lg">
              <div className="bg-white rounded border-2 border-dashed border-solar-300 p-4">
                <p className="text-neutral-600">
                  Small padding: px-4 py-2 on mobile, px-6 py-4 on tablet+
                </p>
              </div>
            </Container>
          </div>

          {/* Medium Padding */}
          <div>
            <h3 className="text-lg font-medium text-neutral-700 mb-4">Medium Padding (Default)</h3>
            <Container size="lg" padding="md" className="bg-ocean-50 border border-ocean-200 rounded-lg">
              <div className="bg-white rounded border-2 border-dashed border-ocean-300 p-4">
                <p className="text-neutral-600">
                  Medium padding: px-4 py-4 on mobile, px-8 py-6 on tablet+
                </p>
              </div>
            </Container>
          </div>

          {/* Large Padding */}
          <div>
            <h3 className="text-lg font-medium text-neutral-700 mb-4">Large Padding</h3>
            <Container size="lg" padding="lg" className="bg-energy-50 border border-energy-200 rounded-lg">
              <div className="bg-white rounded border-2 border-dashed border-energy-300 p-4">
                <p className="text-neutral-600">
                  Large padding: px-6 py-6 on mobile, px-12 py-8 on tablet+
                </p>
              </div>
            </Container>
          </div>

          {/* Extra Large Padding */}
          <div>
            <h3 className="text-lg font-medium text-neutral-700 mb-4">Extra Large Padding</h3>
            <Container size="lg" padding="xl" className="bg-neutral-100 border border-neutral-300 rounded-lg">
              <div className="bg-white rounded border-2 border-dashed border-neutral-400 p-4">
                <p className="text-neutral-600">
                  Extra large padding: px-8 py-8 on mobile, px-16 py-12 on tablet+
                </p>
              </div>
            </Container>
          </div>
        </div>
      </SectionContainer>

      {/* Specialized Containers */}
      <SectionContainer className="mb-16">
        <h2 className="text-2xl font-semibold text-neutral-900 mb-8">Specialized Containers</h2>
        
        <div className="space-y-8">
          {/* Section Container */}
          <div>
            <h3 className="text-lg font-medium text-neutral-700 mb-4">Section Container</h3>
            <div className="bg-solar-50 border border-solar-200 rounded-lg p-1">
              <SectionContainer className="bg-white rounded border-2 border-dashed border-solar-300">
                <Card>
                  <CardHeader>
                    <CardTitle>Section Container</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-600">
                      Specialized for page sections with relative positioning and large padding by default.
                      Perfect for major page sections and hero areas.
                    </p>
                  </CardContent>
                </Card>
              </SectionContainer>
            </div>
          </div>

          {/* Content Container */}
          <div>
            <h3 className="text-lg font-medium text-neutral-700 mb-4">Content Container</h3>
            <div className="bg-ocean-50 border border-ocean-200 rounded-lg p-1">
              <ContentContainer className="bg-white rounded border-2 border-dashed border-ocean-300">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Container</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-600">
                      Optimized for main content areas with prose styling. Fixed at large size (1024px max-width)
                      for optimal readability. Includes typography enhancements.
                    </p>
                  </CardContent>
                </Card>
              </ContentContainer>
            </div>
          </div>

          {/* Narrow Container */}
          <div>
            <h3 className="text-lg font-medium text-neutral-700 mb-4">Narrow Container</h3>
            <div className="bg-energy-50 border border-energy-200 rounded-lg p-1">
              <NarrowContainer className="bg-white rounded border-2 border-dashed border-energy-300">
                <Card>
                  <CardHeader>
                    <CardTitle>Narrow Container</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-600">
                      Perfect for forms and focused content. Fixed at 672px max-width (max-w-2xl)
                      to provide an optimal form-filling experience.
                    </p>
                  </CardContent>
                </Card>
              </NarrowContainer>
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* Responsive Behavior */}
      <SectionContainer>
        <h2 className="text-2xl font-semibold text-neutral-900 mb-8">Responsive Behavior</h2>
        
        <Container size="lg" className="bg-gradient-to-r from-solar-100 to-energy-100 border border-solar-200 rounded-lg">
          <Card>
            <CardHeader>
              <CardTitle>Responsive Container</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-neutral-600">
                This container demonstrates responsive behavior:
              </p>
              <ul className="list-disc list-inside space-y-2 text-neutral-600">
                <li><strong>Mobile (&lt; 768px):</strong> Smaller padding, full width up to max-width</li>
                <li><strong>Tablet (≥ 768px):</strong> Increased padding, centered with max-width constraint</li>
                <li><strong>Desktop (≥ 1024px):</strong> Full max-width utilization with optimal spacing</li>
              </ul>
              <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm text-neutral-500">
                  <strong>Try this:</strong> Resize your browser window to see how the container
                  adapts its padding and width constraints at different breakpoints.
                </p>
              </div>
            </CardContent>
          </Card>
        </Container>
      </SectionContainer>
    </div>
  );
}

export default ContainerDemo;