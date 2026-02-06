/**
 * Enhanced Button Demo Page
 * Showcases the enhanced Button component with all variants and states
 */

'use client';

// Client component for enhanced button demo

import { EnhancedButtonDemo } from '@/components/demo/EnhancedButtonDemo';

export default function EnhancedButtonDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <EnhancedButtonDemo />
    </div>
  );
}