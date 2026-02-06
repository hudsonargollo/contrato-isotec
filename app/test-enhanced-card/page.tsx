/**
 * Enhanced Card Test Page
 * Visual testing page for the enhanced Card component
 */

'use client';

// Client component for enhanced card demo

import dynamicImport from 'next/dynamic';

// Dynamically import the component to avoid SSR issues
const EnhancedCardDemo = dynamicImport(
  () => import('@/components/demo/EnhancedCardDemo').then(mod => ({ default: mod.EnhancedCardDemo })),
  { ssr: false }
);

export default function TestEnhancedCardPage() {
  return <EnhancedCardDemo />;
}