/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events for payment status updates
 * Requirements: 4.3 - Payment gateway integration and tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/services/stripe';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { auditLogger } from '@/lib/services/audit-log';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = stripeService.verifyWebhookSignature(body, signature);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Extract tenant context from event metadata
    const tenantId = event.data.object.metadata?.tenant_id;
    if (!tenantId) {
      console.error('No tenant_id found in webhook event metadata');
      return NextResponse.json(
        { error: 'Missing tenant context' },
        { status: 400 }
      );
    }

    // Create tenant context for processing
    const context = {
      tenant_id: tenantId,
      user_id: 'system', // System user for webhook processing
      permissions: [],
      subscription_limits: {}
    };

    // Process the webhook event
    await stripeService.processWebhookEvent(event, context);

    // Log webhook processing
    await auditLogger.log({
      tenant_id: tenantId,
      user_id: 'system',
      action: 'payments.webhook_processed',
      resource_type: 'payment',
      resource_id: event.data.object.id,
      details: {
        event_type: event.type,
        event_id: event.id,
        payment_intent_id: event.data.object.id,
        invoice_id: event.data.object.metadata?.invoice_id,
        amount: event.data.object.amount ? event.data.object.amount / 100 : undefined,
        currency: event.data.object.currency,
        status: event.data.object.status,
      }
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Log webhook error
    try {
      await auditLogger.log({
        tenant_id: 'unknown',
        user_id: 'system',
        action: 'payments.webhook_error',
        resource_type: 'payment',
        resource_id: 'unknown',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        }
      });
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Disable body parsing for webhook signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';