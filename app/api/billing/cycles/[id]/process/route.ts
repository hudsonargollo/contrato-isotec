/**
 * Process Billing Cycle API Route
 * 
 * API endpoint for processing a billing cycle, calculating charges,
 * and generating invoices.
 * 
 * Requirements: 9.2 - Usage-based billing tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUsageBillingService } from '@/lib/services/usage-billing';
import { getCurrentUser } from '@/lib/auth/server';
import { getTenantContext } from '@/lib/auth/tenant-context';
import { hasPermission } from '@/lib/auth/permissions';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/billing/cycles/[id]/process - Process billing cycle
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    // Check permissions - only admins can process billing cycles
    if (!hasPermission(tenantContext.permissions, 'billing.manage')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Billing cycle ID is required' },
        { status: 400 }
      );
    }

    const usageBillingService = getUsageBillingService();
    
    // Process the billing cycle
    const processedCycle = await usageBillingService.processBillingCycle(id);

    return NextResponse.json({
      success: true,
      message: 'Billing cycle processed successfully',
      billing_cycle: processedCycle
    });
  } catch (error) {
    console.error('Error processing billing cycle:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('Failed to get billing cycle')) {
        return NextResponse.json(
          { error: 'Billing cycle not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process billing cycle' },
      { status: 500 }
    );
  }
}