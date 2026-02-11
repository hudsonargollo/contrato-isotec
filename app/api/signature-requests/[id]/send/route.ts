/**
 * Send Signature Request API Route
 * 
 * API endpoint for sending signature requests to e-signature providers.
 * 
 * Requirements: 7.3 - E-signature integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createESignatureService } from '@/lib/services/e-signature';
import { getTenantContext } from '@/lib/utils/tenant-context';

/**
 * POST /api/signature-requests/[id]/send
 * Send signature request to provider
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
    const eSignatureService = createESignatureService(tenantContext);

    // Send signature request to provider
    const sentRequest = await eSignatureService.sendSignatureRequest(requestId);

    return NextResponse.json({
      success: true,
      message: 'Signature request sent successfully',
      data: sentRequest
    });

  } catch (error) {
    console.error('Error sending signature request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send signature request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}