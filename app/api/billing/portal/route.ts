/**
 * Billing Portal API Route
 * 
 * API endpoint for generating Stripe billing portal URLs for tenant
 * subscription and payment management.
 * 
 * Requirements: 9.3, 9.4 - Automated billing and payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAutomatedBillingService } from '@/lib/services/automated-billing';
import { getCurrentUser } from '@/lib/auth/server';
import { getTenantContext } from '@/lib/auth/tenant-context';
import { hasPermission } from '@/lib/auth/permissions';
import { z } from 'zod';

// Billing portal request schema
const billingPortalSchema = z.object({
  return_url: z.string().url()
});

/**
 * POST /api/billing/portal - Generate billing portal URL
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

    // Check permissions - only owners and admins can access billing portal
    if (!hasPermission(tenantContext.permissions, 'billing.manage')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { return_url } = billingPortalSchema.parse(body);

    const automatedBillingService = getAutomatedBillingService();
    const portalUrl = await automatedBillingService.getBillingPortalUrl(
      tenantContext.tenant_id,
      return_url
    );

    return NextResponse.json({
      success: true,
      portal_url: portalUrl
    });
  } catch (error) {
    console.error('Error generating billing portal URL:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('No Stripe customer ID')) {
        return NextResponse.json(
          { error: 'No billing account found. Please set up billing first.' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate billing portal URL' },
      { status: 500 }
    );
  }
}