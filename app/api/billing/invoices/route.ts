/**
 * Billing Invoices API Routes
 * 
 * API endpoints for retrieving billing invoices and payment history
 * for tenant billing management.
 * 
 * Requirements: 9.3, 9.4 - Automated billing and payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAutomatedBillingService } from '@/lib/services/automated-billing';
import { getCurrentUser } from '@/lib/auth/server';
import { getTenantContext } from '@/lib/auth/tenant-context';
import { hasPermission } from '@/lib/auth/permissions';

/**
 * GET /api/billing/invoices - Get billing invoices
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    // Check permissions
    if (!hasPermission(tenantContext.permissions, 'billing.view')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');

    const automatedBillingService = getAutomatedBillingService();
    const invoices = await automatedBillingService.getBillingHistory(
      tenantContext.tenant_id,
      limit
    );

    return NextResponse.json({
      invoices: invoices.map(invoice => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        amount_due: invoice.amount_due,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        due_date: invoice.due_date.toISOString(),
        paid_at: invoice.paid_at?.toISOString(),
        payment_failure_reason: invoice.payment_failure_reason,
        retry_count: invoice.retry_count,
        created_at: invoice.created_at.toISOString()
      })),
      total: invoices.length
    });
  } catch (error) {
    console.error('Error getting billing invoices:', error);
    return NextResponse.json(
      { error: 'Failed to get billing invoices' },
      { status: 500 }
    );
  }
}