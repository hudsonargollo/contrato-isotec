/**
 * Embedded Signing URL API Route
 * 
 * API endpoint for getting embedded signing URLs from e-signature providers.
 * 
 * Requirements: 7.3 - E-signature integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createESignatureService } from '@/lib/services/e-signature';
import { getTenantContext } from '@/lib/utils/tenant-context';

/**
 * POST /api/signature-requests/[id]/embedded-signing
 * Get embedded signing URL for signer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 401 }
      );
    }

    const requestId = params.id;
    const body = await request.json();
    const { signer_email } = body;

    if (!signer_email) {
      return NextResponse.json(
        { error: 'Signer email is required' },
        { status: 400 }
      );
    }

    const eSignatureService = createESignatureService(tenantContext);

    // Get embedded signing URL
    const signingUrl = await eSignatureService.getEmbeddedSigningUrl(requestId, signer_email);

    return NextResponse.json({
      success: true,
      data: {
        signing_url: signingUrl,
        expires_in: 3600 // 1 hour in seconds
      }
    });

  } catch (error) {
    console.error('Error getting embedded signing URL:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get embedded signing URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}