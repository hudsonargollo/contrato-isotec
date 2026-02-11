/**
 * Usage Billing API Routes
 * 
 * API endpoints for tracking usage events and managing usage-based billing.
 * Supports real-time usage tracking, billing calculations, and cycle management.
 * 
 * Requirements: 9.2 - Usage-based billing tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUsageBillingService } from '@/lib/services/usage-billing';
import { getCurrentUser } from '@/lib/auth/server';
import { getTenantContext } from '@/lib/auth/tenant-context';
import { z } from 'zod';

// Track usage event schema
const trackUsageSchema = z.object({
  event_type: z.enum([
    'api_call',
    'whatsapp_message_sent',
    'whatsapp_message_received',
    'email_sent',
    'sms_sent',
    'contract_generated',
    'invoice_created',
    'lead_created',
    'storage_used',
    'user_session',
    'report_generated',
    'webhook_delivered'
  ]),
  quantity: z.number().int().min(1).default(1),
  metadata: z.record(z.any()).default({})
});

// Track batch usage events schema
const trackBatchUsageSchema = z.object({
  events: z.array(trackUsageSchema).min(1).max(100)
});

/**
 * POST /api/billing/usage - Track usage event
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    const body = await request.json();
    
    // Check if it's a batch request
    if (body.events && Array.isArray(body.events)) {
      const { events } = trackBatchUsageSchema.parse(body);
      
      const usageBillingService = getUsageBillingService();
      await usageBillingService.trackUsageEventsBatch(
        events.map(event => ({
          ...event,
          tenant_id: tenantContext.tenant_id
        }))
      );

      return NextResponse.json({ 
        success: true, 
        message: `Tracked ${events.length} usage events` 
      });
    } else {
      // Single event tracking
      const event = trackUsageSchema.parse(body);
      
      const usageBillingService = getUsageBillingService();
      await usageBillingService.trackUsageEvent({
        ...event,
        tenant_id: tenantContext.tenant_id
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Usage event tracked successfully' 
      });
    }
  } catch (error) {
    console.error('Error tracking usage:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to track usage event' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/billing/usage - Get current period usage
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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'current';

    const usageBillingService = getUsageBillingService();

    if (period === 'current') {
      // Get current period usage
      const usage = await usageBillingService.getCurrentPeriodUsage(tenantContext.tenant_id);
      
      return NextResponse.json({
        tenant_id: tenantContext.tenant_id,
        period: 'current',
        usage
      });
    } else {
      // Get usage summary for specific period
      const startDate = searchParams.get('start_date');
      const endDate = searchParams.get('end_date');

      if (!startDate || !endDate) {
        return NextResponse.json(
          { error: 'start_date and end_date are required for historical usage' },
          { status: 400 }
        );
      }

      const periodStart = new Date(startDate);
      const periodEnd = new Date(endDate);

      if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }

      const usageSummary = await usageBillingService.getUsageSummary(
        tenantContext.tenant_id,
        periodStart,
        periodEnd
      );

      return NextResponse.json({
        tenant_id: tenantContext.tenant_id,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        usage_summary: usageSummary
      });
    }
  } catch (error) {
    console.error('Error getting usage data:', error);
    return NextResponse.json(
      { error: 'Failed to get usage data' },
      { status: 500 }
    );
  }
}