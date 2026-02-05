/**
 * Enhanced Card Component Demo
 * Showcases the enhanced Card component with different variants and features
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Star, Users, TrendingUp } from 'lucide-react';

export function EnhancedCardDemo() {
  return (
    <div className="p-8 bg-neutral-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-neutral-900">Enhanced Card Component</h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Premium card components with ISOTEC brand styling, hover effects, and interactive variants.
          </p>
        </div>

        {/* Default Cards */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Default Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Card</CardTitle>
                <CardDescription>
                  A simple card with default styling and subtle shadow.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-700">
                  This card uses the default variant with clean borders and minimal shadow.
                </p>
              </CardContent>
            </Card>

            <Card hover>
              <CardHeader>
                <CardTitle>Hover Card</CardTitle>
                <CardDescription>
                  A card with hover effects enabled for better interactivity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-700">
                  Hover over this card to see the enhanced shadow and border effects.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>
                  A card with enhanced shadow for more prominence.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-700">
                  This card has a more prominent shadow and border styling.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Interactive Cards */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Interactive Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card variant="interactive">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-solar-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-solar-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Performance</CardTitle>
                    <CardDescription>Click to view details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-solar-600">+24%</div>
                  <p className="text-sm text-neutral-600">
                    Energy efficiency improvement this month
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card variant="interactive">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-ocean-100 rounded-lg">
                    <Users className="w-6 h-6 text-ocean-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Customers</CardTitle>
                    <CardDescription>Active installations</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-ocean-600">1,247</div>
                  <p className="text-sm text-neutral-600">
                    Solar installations completed
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card variant="interactive">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-energy-100 rounded-lg">
                    <Star className="w-6 h-6 text-energy-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Rating</CardTitle>
                    <CardDescription>Customer satisfaction</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-energy-600">4.9/5</div>
                  <p className="text-sm text-neutral-600">
                    Average customer rating
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Outlined Cards */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Outlined Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="outlined">
              <CardHeader>
                <CardTitle>Solar Package</CardTitle>
                <CardDescription>
                  Premium solar installation package with extended warranty.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold text-solar-600">$12,999</div>
                  <ul className="space-y-2 text-sm text-neutral-700">
                    <li>• 20 high-efficiency solar panels</li>
                    <li>• Professional installation</li>
                    <li>• 25-year warranty</li>
                    <li>• Monitoring system included</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Get Quote</Button>
              </CardFooter>
            </Card>

            <Card variant="outlined">
              <CardHeader>
                <CardTitle>Maintenance Plan</CardTitle>
                <CardDescription>
                  Annual maintenance and monitoring service for optimal performance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold text-solar-600">$299/year</div>
                  <ul className="space-y-2 text-sm text-neutral-700">
                    <li>• Quarterly system inspections</li>
                    <li>• Performance monitoring</li>
                    <li>• Priority support</li>
                    <li>• Cleaning service included</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Learn More</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Feature Showcase */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Feature Showcase</h2>
          <Card variant="interactive" className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ISOTEC Solar Solutions</CardTitle>
                  <CardDescription>
                    Experience the future of renewable energy
                  </CardDescription>
                </div>
                <Heart className="w-6 h-6 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-neutral-700">
                  Our enhanced card component features smooth hover animations, 
                  scale effects, and premium styling that aligns with ISOTEC's 
                  brand identity.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="font-medium text-neutral-900">Features:</div>
                    <ul className="text-neutral-600 space-y-1">
                      <li>• Hover effects</li>
                      <li>• Scale animations</li>
                      <li>• Multiple variants</li>
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-neutral-900">Benefits:</div>
                    <ul className="text-neutral-600 space-y-1">
                      <li>• Premium appearance</li>
                      <li>• Brand consistency</li>
                      <li>• Enhanced UX</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline">Learn More</Button>
              <Button>Get Started</Button>
            </CardFooter>
          </Card>
        </section>
      </div>
    </div>
  );
}

export default EnhancedCardDemo;