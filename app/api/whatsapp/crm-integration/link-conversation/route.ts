/**
 * WhatsApp-CRM Integration: Link Conversation to Lead
 * Requirements: 5.5 - WhatsApp Business Integration with CRM
 */

import { NextRequest, NextResponse } from 'next/server';
import { whatsappCRMIntegration } from '@/lib/services/whatsapp-crm-integration';
import { getTenantContext } from '@/lib/utils/tenant-context';

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
    const { conversation_id, lead_id } = body;

    if (!conversation_id || !lead_id) {
      return NextResponse.json(
        { error: 'conversation_id and lead_id are required' },
        { status: 400 }
      );
    }

    const result = await whatsappCRMIntegration.linkConversationToLead(
      conversation_id,
      lead_id,
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
        conversation_id: result.conversation_id
      }
    });

  } catch (error) {
    console.error('Link conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}