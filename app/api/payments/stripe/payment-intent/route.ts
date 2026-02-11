/**
 * Stripe Payment Intent API Route
 * Creates and manages Stripe payment intents for invoices
 * Requirements: 4.3 - Payment gateway integration and tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeService, StripePaymentIntentRequest } from '@/lib/services/stripe';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { invoiceService } from '@/lib/services/invoice';
import { auditLogger } from '@/lib/services/audit-log';

export async function POST(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: StripePaymentIntentRequest = await request.json();

    // Validate required fields
    if (!body.invoice_id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (!body.currency) {
      return NextResponse.json(
        { error: 'Currency is required' },
        { status: 400 }
      );
    }

    // Validate currency
    const validCurrencies = ['BRL', 'USD', 'EUR'];
    if (!validCurrencies.includes(body.currency.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid currency. Supported currencies: BRL, USD, EUR' },
        { status: 400 }
      );
    }

    // Check if invoice exists and belongs to tenant
    const invoice = await invoiceService.getInvoice(body.invoice_id, context);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if invoice can be paid
    if (invoice.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot create payment for cancelled invoice' },
        { status: 400 }
      );
    }

    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Invoice is already paid' },
        { status: 400 }
      );
    }

    // Set default customer information from invoice if not provided
    if (!body.customer_email && invoice.customer_email) {
      body.customer_email = invoice.customer_email;
    }

    if (!body.customer_name && invoice.customer_name) {
      body.customer_name = invoice.customer_name;
    }

    // Add tenant and invoice metadata
    body.metadata = {
      ...body.metadata,
      tenant_id: context.tenant_id,
      invoice_number: invoice.invoice_number,
      customer_name: invoice.customer_name,
    };

    // Create payment intent
    const paymentIntent = await stripeService.createPaymentIntent(body, context);

    // Log the activity
    await auditLogger.log({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'payments.create_intent',
      resource_type: 'invoice',
      resource_id: invoice.id,
      details: {
        invoice_number: invoice.invoice_number,
        customer_name: invoice.customer_name,
        payment_intent_id: paymentIntent.payment_intent_id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      }
    });

    return NextResponse.json({
      message: 'Payment intent created successfully',
      payment_intent: paymentIntent,
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        customer_name: invoice.customer_name,
        total_amount: invoice.total_amount,
        currency: invoice.currency,
        due_date: invoice.due_date,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create payment intent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent_id');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Get payment intent from Stripe
    const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);

    // Verify tenant access
    if (paymentIntent.metadata.tenant_id !== context.tenant_id) {
      return NextResponse.json({ error: 'Payment intent not found' }, { status: 404 });
    }

    // Log the activity
    await auditLogger.log({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'payments.view_intent',
      resource_type: 'payment',
      resource_id: paymentIntent.id,
      details: {
        payment_intent_id: paymentIntent.id,
        invoice_id: paymentIntent.metadata.invoice_id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
      }
    });

    return NextResponse.json({
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      metadata: paymentIntent.metadata,
      created: paymentIntent.created,
      last_payment_error: paymentIntent.last_payment_error,
    });
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve payment intent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}