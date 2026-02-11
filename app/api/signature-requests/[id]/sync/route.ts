/**
 * Sync Signature Request Status API Route
 * 
 * API endpoint for syncing signature request status from e-signature providers.
 * 
 * Requirements: 7.3 - E-signature integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createESignatureService } from '@/lib/services/e-signature';
import { getTenantContext } from '@/lib/utils/tenant-context';

/**
 * POST /api/signature-requests/[id]/sync
 * Sync signature request status from provider
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

    // Sync status from provider
    const syncedRequest = await eSignatureService.syncSignatureRequestStatus(requestId);

    return NextResponse.json({
      success: true,
      message: 'Signature request status synced successfully',
      data: syncedRequest
    });

  } catch (error) {
    console.error('Error syncing signature request status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync signature request status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}