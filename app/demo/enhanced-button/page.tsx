/**
 * Enhanced Button Demo Page
 * Showcases the enhanced Button component with all variants and states
 */

import { EnhancedButtonDemo } from '@/components/demo/EnhancedButtonDemo';

export default function EnhancedButtonDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <EnhancedButtonDemo />
    </div>
  );
}

export const metadata = {
  title: 'Enhanced Button Demo - ISOTEC UI Components',
  description: 'Showcase of the enhanced Button component with solar gradient, multiple variants, and loading states.',
};