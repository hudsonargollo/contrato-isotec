/**
 * WhatsApp-CRM Integration: Analytics
 * Requirements: 5.5 - WhatsApp Business Integration with CRM
 */

import { NextRequest, NextResponse } from 'next/server';
import { whatsappCRMIntegration } from '@/lib/services/whatsapp-crm-integration';
import { getTenantContext } from '@/lib/utils/tenant-context';

export async function GET(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let dateRange: { start: Date; end: Date } | undefined;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    const analytics = await whatsappCRMIntegration.getWhatsAppCRMAnalytics(
      context,
      dateRange
    );

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('WhatsApp CRM analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}