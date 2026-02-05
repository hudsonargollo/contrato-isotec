/**
 * Spacing and Animation Demo Page
 * 
 * A demo page to showcase the spacing and animation utilities.
 */

import { SpacingAnimationDemo } from '@/components/demo/SpacingAnimationDemo';

export default function SpacingAnimationDemoPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <SpacingAnimationDemo />
    </div>
  );
}

export const metadata = {
  title: 'Spacing & Animation Demo - ISOTEC Design System',
  description: 'Demonstration of the spacing scale and animation utilities for the ISOTEC design system.',
};