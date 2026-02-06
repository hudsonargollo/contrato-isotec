/**
 * EmailSignature Demo Page
 * Test page for responsive EmailSignature component improvements
 * 
 * Requirements: 12.6, 3.7
 */

'use client';

import { EmailSignatureDemo } from '@/components/demo/EmailSignatureDemo';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function EmailSignatureDemoPage() {
  return <EmailSignatureDemo />;
}