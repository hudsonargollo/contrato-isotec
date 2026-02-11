/**
 * Send Signature Reminder API Route
 * 
 * API endpoint for sending reminders to signers.
 * 
 * Requirements: 7.3 - E-signature integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createESignatureService } from '@/lib/services/e-signature';
import { getTenantContext } from '@/lib/utils/tenant-context';

/**
 * POST /api/signature-requests/[id]/reminder
 * Send reminder to signer
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

    // Send reminder
    await eSignatureService.sendReminder(requestId, signer_email);

    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully'
    });

  } catch (error) {
    console.error('Error sending reminder:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send reminder',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}