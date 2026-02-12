/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events for subscription and payment processing,
 * including payment failures, subscription updates, and invoice events.
 * 
 * Requirements: 9.3, 9.4 - Automated billing and payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { getAutomatedBillingService } from '@/lib/services/automated-billing';

// Helper function to ensure Stripe is initialized
function ensureStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY not found in environment variables');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia'
  });
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      const stripe = ensureStripe();
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`Received Stripe webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'setup_intent.succeeded':
        await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const tenantId = invoice.metadata?.tenant_id;
    if (!tenantId) {
      console.error('No tenant_id in invoice metadata');
      return;
    }

    // Update internal invoice status
    const { data: updatedInvoice } = await supabase
      .from('billing_invoices')
      .update({
        status: 'paid',
        amount_paid: (invoice.amount_paid || 0) / 100, // Convert from cents
        paid_at: new Date().toISOString(),
        payment_failure_reason: null,
        retry_count: 0,
        next_retry_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_invoice_id', invoice.id)
      .select()
      .single();

    // Create payment transaction record
    const { data: paymentTransaction } = await supabase
      .from('payment_transactions')
      .insert({
        tenant_id: tenantId,
        invoice_id: invoice.metadata?.internal_invoice_id,
        stripe_payment_intent_id: invoice.payment_intent as string,
        amount: (invoice.amount_paid || 0) / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'succeeded',
        payment_method_type: 'card', // This could be determined from payment intent
        processed_at: new Date().toISOString()
      })
      .select()
      .single();

    // Send webhook notifications
    try {
      const { WebhookEvents } = await import('@/lib/services/webhook');
      if (updatedInvoice) {
        await WebhookEvents.invoicePaid(tenantId, updatedInvoice, paymentTransaction);
      }
      if (paymentTransaction) {
        await WebhookEvents.paymentSucceeded(tenantId, paymentTransaction);
      }
    } catch (webhookError) {
      console.error('Failed to send payment webhook:', webhookError);
    }

    console.log(`Invoice payment succeeded for tenant ${tenantId}`);
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const tenantId = invoice.metadata?.tenant_id;
    const internalInvoiceId = invoice.metadata?.internal_invoice_id;
    
    if (!tenantId || !internalInvoiceId) {
      console.error('Missing tenant_id or internal_invoice_id in invoice metadata');
      return;
    }

    // Get current retry count
    const { data: currentInvoice } = await supabase
      .from('billing_invoices')
      .select('retry_count')
      .eq('id', internalInvoiceId)
      .single();

    const retryCount = currentInvoice?.retry_count || 0;
    const failureReason = invoice.last_finalization_error?.message || 'Payment failed';

    // Use automated billing service to handle payment failure
    const automatedBillingService = getAutomatedBillingService();
    await automatedBillingService.handlePaymentFailure(
      internalInvoiceId,
      failureReason,
      retryCount
    );

    // Create failed payment transaction record
    const { data: paymentTransaction } = await supabase
      .from('payment_transactions')
      .insert({
        tenant_id: tenantId,
        invoice_id: internalInvoiceId,
        stripe_payment_intent_id: invoice.payment_intent as string,
        amount: (invoice.amount_due || 0) / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'failed',
        payment_method_type: 'card',
        failure_reason: failureReason,
        processed_at: new Date().toISOString()
      })
      .select()
      .single();

    // Send webhook notification
    try {
      const { WebhookEvents } = await import('@/lib/services/webhook');
      if (paymentTransaction) {
        await WebhookEvents.paymentFailed(tenantId, paymentTransaction, failureReason);
      }
    } catch (webhookError) {
      console.error('Failed to send payment failed webhook:', webhookError);
    }

    console.log(`Invoice payment failed for tenant ${tenantId}, retry count: ${retryCount + 1}`);
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const tenantId = subscription.metadata?.tenant_id;
    if (!tenantId) {
      console.error('No tenant_id in subscription metadata');
      return;
    }

    // Update subscription billing record
    await supabase
      .from('subscription_billing')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at 
          ? new Date(subscription.canceled_at * 1000).toISOString() 
          : null,
        trial_end: subscription.trial_end 
          ? new Date(subscription.trial_end * 1000).toISOString() 
          : null,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    // Update tenant subscription status if needed
    if (subscription.status === 'past_due') {
      await supabase
        .from('tenants')
        .update({
          status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);
    } else if (subscription.status === 'active') {
      await supabase
        .from('tenants')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);
    }

    console.log(`Subscription updated for tenant ${tenantId}: ${subscription.status}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const tenantId = subscription.metadata?.tenant_id;
    if (!tenantId) {
      console.error('No tenant_id in subscription metadata');
      return;
    }

    // Update subscription billing record
    await supabase
      .from('subscription_billing')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    // Update tenant status
    await supabase
      .from('tenants')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId);

    console.log(`Subscription deleted for tenant ${tenantId}`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Update payment transaction if exists
    await supabase
      .from('payment_transactions')
      .update({
        status: 'succeeded',
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    console.log(`Payment intent succeeded: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';

    // Update payment transaction if exists
    await supabase
      .from('payment_transactions')
      .update({
        status: 'failed',
        failure_reason: failureReason,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    console.log(`Payment intent failed: ${paymentIntent.id} - ${failureReason}`);
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

/**
 * Handle successful setup intent (for saving payment methods)
 */
async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  try {
    const tenantId = setupIntent.metadata?.tenant_id;
    const paymentMethodId = setupIntent.payment_method as string;

    if (!tenantId || !paymentMethodId) {
      console.error('Missing tenant_id or payment_method in setup intent metadata');
      return;
    }

    // Get payment method details from Stripe
    const stripe = ensureStripe();
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Store payment method in database
    await supabase
      .from('payment_methods')
      .insert({
        tenant_id: tenantId,
        stripe_payment_method_id: paymentMethodId,
        type: paymentMethod.type,
        last_four: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand,
        exp_month: paymentMethod.card?.exp_month,
        exp_year: paymentMethod.card?.exp_year,
        is_default: false // Will be set by trigger if it's the first payment method
      });

    console.log(`Payment method saved for tenant ${tenantId}`);
  } catch (error) {
    console.error('Error handling setup intent succeeded:', error);
  }
}