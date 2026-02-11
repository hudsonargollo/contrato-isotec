/**
 * Stripe Refund API Route
 * Handles payment refunds through Stripe
 * Requirements: 4.3 - Payment gateway integration and tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/services/stripe';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { invoiceService } from '@/lib/services/invoice';
import { auditLogger } from '@/lib/services/audit-log';

interface RefundRequest {
  payment_intent_id: string;
  amount?: number;
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RefundRequest = await request.json();

    // Validate required fields
    if (!body.payment_intent_id) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Validate amount if provided
    if (body.amount !== undefined && body.amount <= 0) {
      return NextResponse.json(
        { error: 'Refund amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate reason if provided
    const validReasons = ['duplicate', 'fraudulent', 'requested_by_customer'];
    if (body.reason && !validReasons.includes(body.reason)) {
      return NextResponse.json(
        { error: 'Invalid refund reason' },
        { status: 400 }
      );
    }

    // Get payment intent to verify tenant access
    const paymentIntent = await stripeService.getPaymentIntent(body.payment_intent_id);
    
    if (paymentIntent.metadata.tenant_id !== context.tenant_id) {
      return NextResponse.json({ error: 'Payment intent not found' }, { status: 404 });
    }

    // Check if payment intent is in a refundable state
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment intent must be succeeded to create refund' },
        { status: 400 }
      );
    }

    // Create refund metadata
    const refundMetadata = {
      tenant_id: context.tenant_id,
      invoice_id: paymentIntent.metadata.invoice_id,
      invoice_number: paymentIntent.metadata.invoice_number,
      refunded_by: context.user_id,
      refund_reason: body.reason || 'requested_by_customer',
      refund_description: body.description || 'Refund processed via API',
    };

    // Create refund in Stripe
    const refund = await stripeService.createRefund(
      body.payment_intent_id,
      body.amount,
      body.reason,
      refundMetadata
    );

    // Create refund payment record in local database
    if (paymentIntent.metadata.invoice_id) {
      const refundPaymentRequest = {
        invoice_id: paymentIntent.metadata.invoice_id,
        amount: -(refund.amount / 100), // Negative amount for refund
        currency: refund.currency.toUpperCase(),
        payment_method: 'credit_card',
        payment_date: new Date(),
        transaction_id: refund.id,
        gateway_reference: refund.charge,
        gateway_response: {
          refund_id: refund.id,
          payment_intent_id: body.payment_intent_id,
          status: refund.status,
          reason: refund.reason,
          created: refund.created,
        },
        notes: `Refund for payment intent ${body.payment_intent_id}. Reason: ${body.reason || 'requested_by_customer'}`,
        metadata: {
          stripe_refund_id: refund.id,
          original_payment_intent_id: body.payment_intent_id,
          refund_reason: body.reason,
          refund_description: body.description,
        },
      };

      await invoiceService.addPayment(refundPaymentRequest, context);
    }

    // Log the refund activity
    await auditLogger.log({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'payments.refund',
      resource_type: 'payment',
      resource_id: refund.id,
      details: {
        payment_intent_id: body.payment_intent_id,
        invoice_id: paymentIntent.metadata.invoice_id,
        invoice_number: paymentIntent.metadata.invoice_number,
        refund_id: refund.id,
        refund_amount: refund.amount / 100,
        currency: refund.currency.toUpperCase(),
        reason: refund.reason,
        status: refund.status,
        description: body.description,
      }
    });

    return NextResponse.json({
      message: 'Refund created successfully',
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency.toUpperCase(),
        status: refund.status,
        reason: refund.reason,
        created: refund.created,
        payment_intent_id: body.payment_intent_id,
        charge_id: refund.charge,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating refund:', error);
    
    // Log refund error
    try {
      const context = await getTenantContext(request);
      if (context) {
        await auditLogger.log({
          tenant_id: context.tenant_id,
          user_id: context.user_id,
          action: 'payments.refund_error',
          resource_type: 'payment',
          resource_id: 'unknown',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          }
        });
      }
    } catch (logError) {
      console.error('Failed to log refund error:', logError);
    }

    return NextResponse.json(
      { 
        error: 'Failed to create refund',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}