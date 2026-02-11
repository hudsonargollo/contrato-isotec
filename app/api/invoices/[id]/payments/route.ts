/**
 * Invoice Payments API Route
 * Handles payment recording and tracking
 * Requirements: 4.3 - Payment gateway integration and tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { invoiceService } from '@/lib/services/invoice';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { CreatePaymentRecordRequest } from '@/lib/types/invoice';
import { auditLogger } from '@/lib/services/audit-log';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreatePaymentRecordRequest = await request.json();

    // Validate required fields
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (!body.payment_method) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }

    // Validate payment method
    const validPaymentMethods = ['credit_card', 'bank_transfer', 'pix', 'boleto', 'cash', 'check'];
    if (!validPaymentMethods.includes(body.payment_method)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Check if invoice exists
    const invoice = await invoiceService.getInvoice(params.id, context);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if invoice can receive payments
    if (invoice.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot add payments to cancelled invoices' },
        { status: 400 }
      );
    }

    // Set invoice_id from URL parameter
    body.invoice_id = params.id;

    const payment = await invoiceService.addPayment(body, context);

    // Log the activity
    await auditLogger.log({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'invoices.pay',
      resource_type: 'invoice',
      resource_id: invoice.id,
      details: {
        invoice_number: invoice.invoice_number,
        customer_name: invoice.customer_name,
        payment_id: payment.id,
        payment_amount: payment.amount,
        payment_method: payment.payment_method,
        transaction_id: payment.transaction_id,
        currency: payment.currency
      }
    });

    return NextResponse.json({
      message: 'Payment recorded successfully',
      payment
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get invoice with payments
    const invoice = await invoiceService.getInvoice(params.id, context);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Log the activity
    await auditLogger.log({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'invoices.view_payments',
      resource_type: 'invoice',
      resource_id: invoice.id,
      details: {
        invoice_number: invoice.invoice_number,
        payments_count: invoice.payments?.length || 0
      }
    });

    return NextResponse.json({
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      total_amount: invoice.total_amount,
      payments: invoice.payments || []
    });
  } catch (error) {
    console.error('Error fetching invoice payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice payments' },
      { status: 500 }
    );
  }
}