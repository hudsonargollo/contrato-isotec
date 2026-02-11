/**
 * Signature Request Management API Routes
 * 
 * API endpoints for managing individual signature requests.
 * 
 * Requirements: 7.3 - E-signature integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createESignatureService } from '@/lib/services/e-signature';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { UpdateSignatureRequest } from '@/lib/types/e-signature';

/**
 * GET /api/signature-requests/[id]
 * Get signature request details
 */
export async function GET(
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

    const signatureRequest = await eSignatureService.getSignatureRequestWithSigners(requestId);
    
    if (!signatureRequest) {
      return NextResponse.json(
        { error: 'Signature request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: signatureRequest
    });

  } catch (error) {
    console.error('Error getting signature request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get signature request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/signature-requests/[id]
 * Update signature request
 */
export async function PUT(
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
    const eSignatureService = createESignatureService(tenantContext);

    const updateData: UpdateSignatureRequest = {
      subject: body.subject,
      message: body.message,
      expires_at: body.expires_at ? new Date(body.expires_at) : undefined,
      reminder_enabled: body.reminder_enabled,
      reminder_delay_days: body.reminder_delay_days,
      status: body.status
    };

    const updatedRequest = await eSignatureService.updateSignatureRequest(requestId, updateData);

    return NextResponse.json({
      success: true,
      data: updatedRequest
    });

  } catch (error) {
    console.error('Error updating signature request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update signature request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/signature-requests/[id]
 * Cancel signature request
 */
export async function DELETE(
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

    const cancelledRequest = await eSignatureService.cancelSignatureRequest(requestId);

    return NextResponse.json({
      success: true,
      data: cancelledRequest
    });

  } catch (error) {
    console.error('Error cancelling signature request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel signature request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}