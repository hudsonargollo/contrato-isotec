/**
 * Subscription Management API Routes
 * 
 * API endpoints for creating, updating, and canceling subscriptions
 * with Stripe integration.
 * 
 * Requirements: 9.3, 9.4 - Automated billing and payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAutomatedBillingService } from '@/lib/services/automated-billing';
import { getCurrentUser } from '@/lib/auth/server';
import { getTenantContext } from '@/lib/auth/tenant-context';
import { hasPermission } from '@/lib/auth/permissions';
import { z } from 'zod';

// Create subscription schema
const createSubscriptionSchema = z.object({
  plan: z.enum(['starter', 'professional', 'enterprise']),
  payment_method_id: z.string().optional(),
  trial_days: z.number().int().min(0).max(90).optional()
});

// Cancel subscription schema
const cancelSubscriptionSchema = z.object({
  cancel_at_period_end: z.boolean().default(true)
});

/**
 * POST /api/billing/subscription - Create subscription
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

    // Check permissions - only owners can create subscriptions
    if (!hasPermission(tenantContext.permissions, 'billing.manage')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { plan, payment_method_id, trial_days } = createSubscriptionSchema.parse(body);

    const automatedBillingService = getAutomatedBillingService();
    const subscription = await automatedBillingService.createSubscription(
      tenantContext.tenant_id,
      plan,
      payment_method_id,
      trial_days
    );

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        trial_end: subscription.trial_end,
        cancel_at_period_end: subscription.cancel_at_period_end
      }
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/billing/subscription - Cancel subscription
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    // Check permissions - only owners can cancel subscriptions
    if (!hasPermission(tenantContext.permissions, 'billing.manage')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { cancel_at_period_end } = cancelSubscriptionSchema.parse(body);

    const automatedBillingService = getAutomatedBillingService();
    const subscription = await automatedBillingService.cancelSubscription(
      tenantContext.tenant_id,
      cancel_at_period_end
    );

    return NextResponse.json({
      success: true,
      message: cancel_at_period_end 
        ? 'Subscription will be canceled at the end of the current period'
        : 'Subscription canceled immediately',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at
      }
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}