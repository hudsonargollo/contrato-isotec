/**
 * Invoice Analytics API Route
 * Provides invoice performance metrics and analytics
 * Requirements: 4.1, 4.3 - Invoice analytics and reporting
 */

import { NextRequest, NextResponse } from 'next/server';
import { invoiceService } from '@/lib/services/invoice';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { auditLogger } from '@/lib/services/audit-log';

export async function GET(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analytics = await invoiceService.getAnalytics(context);

    // Log the activity
    await auditLogger.log({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'invoices.analytics',
      resource_type: 'invoice',
      details: {
        total_invoices: analytics.total_invoices,
        total_amount: analytics.total_amount,
        paid_amount: analytics.paid_amount,
        outstanding_amount: analytics.outstanding_amount,
        overdue_amount: analytics.overdue_amount
      }
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching invoice analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice analytics' },
      { status: 500 }
    );
  }
}