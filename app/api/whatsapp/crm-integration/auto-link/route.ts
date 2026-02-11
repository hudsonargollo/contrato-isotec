/**
 * WhatsApp-CRM Integration: Auto-link Conversations
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

    const result = await whatsappCRMIntegration.autoLinkConversations(context);

    return NextResponse.json({
      success: true,
      data: {
        linked_count: result.linked_count,
        errors: result.errors
      }
    });

  } catch (error) {
    console.error('Auto-link conversations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}