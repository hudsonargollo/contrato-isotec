/**
 * Billing Cycles API Routes
 * 
 * API endpoints for managing billing cycles, processing charges,
 * and retrieving billing history.
 * 
 * Requirements: 9.2 - Usage-based billing tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUsageBillingService } from '@/lib/services/usage-billing';
import { getCurrentUser } from '@/lib/auth/server';
import { getTenantContext } from '@/lib/auth/tenant-context';
import { hasPermission } from '@/lib/auth/permissions';
import { z } from 'zod';

// Create billing cycle schema
const createBillingCycleSchema = z.object({
  cycle_start: z.string().datetime(),
  cycle_end: z.string().datetime()
});

/**
 * GET /api/billing/cycles - Get billing cycles
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
    const type = searchParams.get('type') || 'history';
    const limit = parseInt(searchParams.get('limit') || '12');

    const usageBillingService = getUsageBillingService();

    if (type === 'current') {
      // Get current billing cycle
      const currentCycle = await usageBillingService.getCurrentBillingCycle(tenantContext.tenant_id);
      
      return NextResponse.json({
        current_cycle: currentCycle
      });
    } else {
      // Get billing history
      const billingHistory = await usageBillingService.getBillingHistory(
        tenantContext.tenant_id,
        limit
      );

      return NextResponse.json({
        billing_cycles: billingHistory,
        total: billingHistory.length
      });
    }
  } catch (error) {
    console.error('Error getting billing cycles:', error);
    return NextResponse.json(
      { error: 'Failed to get billing cycles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/billing/cycles - Create billing cycle
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

    // Check permissions - only admins can create billing cycles
    if (!hasPermission(tenantContext.permissions, 'billing.manage')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { cycle_start, cycle_end } = createBillingCycleSchema.parse(body);

    const cycleStart = new Date(cycle_start);
    const cycleEnd = new Date(cycle_end);

    // Validate dates
    if (cycleEnd <= cycleStart) {
      return NextResponse.json(
        { error: 'Cycle end date must be after start date' },
        { status: 400 }
      );
    }

    const usageBillingService = getUsageBillingService();
    const billingCycle = await usageBillingService.createBillingCycle(
      tenantContext.tenant_id,
      cycleStart,
      cycleEnd
    );

    return NextResponse.json({
      success: true,
      billing_cycle: billingCycle
    });
  } catch (error) {
    console.error('Error creating billing cycle:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create billing cycle' },
      { status: 500 }
    );
  }
}