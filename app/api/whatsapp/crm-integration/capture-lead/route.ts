/**
 * WhatsApp-CRM Integration: Capture Lead from WhatsApp
 * Requirements: 5.5 - WhatsApp Business Integration with CRM
 */

import { NextRequest, NextResponse } from 'next/server';
import { whatsappCRMIntegration } from '@/lib/services/whatsapp-crm-integration';
import { getTenantContext } from '@/lib/utils/tenant-context';
import type { WhatsAppLeadCaptureData } from '@/lib/services/whatsapp-crm-integration';

export async function POST(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const captureData: WhatsAppLeadCaptureData = {
      phone_number: body.phone_number,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      company: body.company,
      source_message: body.source_message,
      conversation_context: body.conversation_context
    };

    if (!captureData.phone_number) {
      return NextResponse.json(
        { error: 'phone_number is required' },
        { status: 400 }
      );
    }

    const result = await whatsappCRMIntegration.captureLeadFromWhatsApp(
      captureData,
      context
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        lead_id: result.lead_id,
        conversation_id: result.conversation_id,
        is_new_lead: result.is_new_lead
      }
    });

  } catch (error) {
    console.error('Capture lead API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}