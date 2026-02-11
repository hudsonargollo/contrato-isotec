/**
 * WhatsApp-CRM Integration: Get Conversation with CRM Context
 * Requirements: 5.5 - WhatsApp Business Integration with CRM
 */

import { NextRequest, NextResponse } from 'next/server';
import { whatsappCRMIntegration } from '@/lib/services/whatsapp-crm-integration';
import { getTenantContext } from '@/lib/utils/tenant-context';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const conversationId = params.id;
    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const result = await whatsappCRMIntegration.getConversationWithCRMContext(
      conversationId,
      context
    );

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get conversation with CRM context API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}