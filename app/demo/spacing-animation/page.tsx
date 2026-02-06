'use client';

/**
 * Spacing and Animation Demo Page
 * 
 * A demo page to showcase the spacing and animation utilities.
 */

import { SpacingAnimationDemo } from '@/components/demo/SpacingAnimationDemo';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function SpacingAnimationDemoPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <SpacingAnimationDemo />
    </div>
  );
}