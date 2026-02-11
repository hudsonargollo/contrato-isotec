/**
 * Invoice Payment API Route
 * Handles payment processing for invoices
 * Requirements: 4.4 - Customer invoice portal payment processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// Helper function to ensure Stripe is initialized
function ensureStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY not found in environment variables');
  }
  return new Stripe(secretKey, {
    apiVersion: '2024-06-20',
  });
}

interface PaymentRequest {
  payment_method: string;
  amount: number;
  token?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { payment_method, amount, token }: PaymentRequest = await request.json();
    const invoiceId = params.id;

    if (!payment_method || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid payment method or amount' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Verify payment token if provided (for public access)
    if (token) {
      const { data: tokenData, error: tokenError } = await supabase
        .from('invoice_payment_tokens')
        .select('invoice_id, expires_at')
        .eq('token', token)
        .eq('invoice_id', invoiceId)
        .single();

      if (tokenError || !tokenData || new Date(tokenData.expires_at) < new Date()) {
        return NextResponse.json(
          { error: 'Invalid or expired payment token' },
          { status: 401 }
        );
      }
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        customer_name,
        customer_email,
        total_amount,
        currency,
        status,
        tenant_id,
        tenant:tenants(name, settings)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if invoice can be paid
    if (!['sent', 'approved', 'overdue'].includes(invoice.status)) {
      return NextResponse.json(
        { error: 'Invoice cannot be paid in current status' },
        { status: 400 }
      );
    }

    // Calculate remaining amount
    const { data: payments } = await supabase
      .from('payment_records')
      .select('amount')
      .eq('invoice_id', invoiceId)
      .eq('status', 'completed');

    const totalPaid = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
    const remainingAmount = invoice.total_amount - totalPaid;

    if (amount > remainingAmount) {
      return NextResponse.json(
        { error: 'Payment amount exceeds remaining balance' },
        { status: 400 }
      );
    }

    let paymentResult;

    // Process payment based on method
    switch (payment_method) {
      case 'credit_card':
        paymentResult = await processStripePayment(invoice, amount);
        break;
      
      case 'pix':
        paymentResult = await processPIXPayment(invoice, amount);
        break;
      
      case 'bank_transfer':
        paymentResult = await processBankTransfer(invoice, amount);
        break;
      
      case 'boleto':
        paymentResult = await processBoletoPayment(invoice, amount);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Unsupported payment method' },
          { status: 400 }
        );
    }

    // Create payment record
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payment_records')
      .insert({
        tenant_id: invoice.tenant_id,
        invoice_id: invoiceId,
        amount,
        currency: invoice.currency,
        payment_method,
        payment_date: new Date().toISOString().split('T')[0],
        transaction_id: paymentResult.transaction_id,
        gateway_reference: paymentResult.gateway_reference,
        gateway_response: paymentResult.gateway_response,
        status: paymentResult.status,
        created_by: 'system' // Public payment
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
      return NextResponse.json(
        { error: 'Failed to record payment' },
        { status: 500 }
      );
    }

    // Update invoice status if fully paid
    if (amount >= remainingAmount) {
      await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId);
    }

    return NextResponse.json({
      success: true,
      payment_id: paymentRecord.id,
      status: paymentResult.status,
      payment_url: paymentResult.payment_url,
      transaction_id: paymentResult.transaction_id
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}

async function processStripePayment(invoice: any, amount: number) {
  try {
    const stripe = ensureStripe();
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: invoice.currency.toLowerCase(),
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
              description: `Payment for ${invoice.customer_name}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}/pay?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}/pay?canceled=true`,
      customer_email: invoice.customer_email,
      metadata: {
        invoice_id: invoice.id,
        tenant_id: invoice.tenant_id,
      },
    });

    return {
      status: 'pending',
      payment_url: session.url,
      transaction_id: session.id,
      gateway_reference: session.id,
      gateway_response: { session_id: session.id }
    };

  } catch (error) {
    console.error('Stripe payment error:', error);
    throw new Error('Failed to create Stripe payment session');
  }
}

async function processPIXPayment(invoice: any, amount: number) {
  // TODO: Integrate with PIX payment provider (e.g., Mercado Pago, PagSeguro)
  // For now, return a mock response
  return {
    status: 'pending',
    transaction_id: `pix_${Date.now()}`,
    gateway_reference: `pix_${invoice.id}_${Date.now()}`,
    gateway_response: {
      qr_code: 'mock_qr_code_data',
      pix_key: 'mock_pix_key'
    }
  };
}

async function processBankTransfer(invoice: any, amount: number) {
  // Generate bank transfer instructions
  return {
    status: 'pending',
    transaction_id: `transfer_${Date.now()}`,
    gateway_reference: `transfer_${invoice.id}_${Date.now()}`,
    gateway_response: {
      bank_name: 'Banco do Brasil',
      account_number: '12345-6',
      routing_number: '001',
      reference: invoice.invoice_number
    }
  };
}

async function processBoletoPayment(invoice: any, amount: number) {
  // TODO: Integrate with boleto provider (e.g., Banco do Brasil, Itaú)
  // For now, return a mock response
  return {
    status: 'pending',
    transaction_id: `boleto_${Date.now()}`,
    gateway_reference: `boleto_${invoice.id}_${Date.now()}`,
    gateway_response: {
      boleto_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/invoices/${invoice.id}/boleto`,
      barcode: '12345678901234567890123456789012345678901234',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  };
}