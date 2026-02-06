/**
 * Enhanced Button Demo Page
 * Showcases the enhanced Button component with all variants and states
 */

'use client';

import { EnhancedButtonDemo } from '@/components/demo/EnhancedButtonDemo';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function EnhancedButtonDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <EnhancedButtonDemo />
    </div>
  );
}