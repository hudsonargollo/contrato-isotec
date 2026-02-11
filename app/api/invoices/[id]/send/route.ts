/**
 * Invoice Send API Route
 * Handles sending invoices via email with automated delivery
 * Requirements: 4.4 - Automated invoice delivery system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { invoiceDeliveryService } from '@/lib/services/invoice-delivery';
import { invoiceService } from '@/lib/services/invoice';
import { InvoiceDeliveryOptions } from '@/lib/types/invoice';
import { TenantContext } from '@/lib/types/tenant';

interface SendInvoiceRequest {
  recipients: string[];
  subject?: string;
  message?: string;
  include_pdf?: boolean;
  include_payment_link?: boolean;
  schedule_at?: string;
  cc?: string[];
  bcc?: string[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    const {
      recipients,
      subject,
      message,
      include_pdf = true,
      include_payment_link = true,
      schedule_at,
      cc,
      bcc
    }: SendInvoiceRequest = await request.json();

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's tenant context
    const { data: userTenant, error: tenantError } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (tenantError || !userTenant) {
      return NextResponse.json(
        { error: 'User tenant not found' },
        { status: 403 }
      );
    }

    const context: TenantContext = {
      tenant_id: userTenant.tenant_id,
      user_id: user.id
    };

    // Verify invoice exists and user has access
    const invoice = await invoiceService.getInvoice(invoiceId, context);
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if invoice can be sent
    if (!['draft', 'approved', 'sent'].includes(invoice.status)) {
      return NextResponse.json(
        { error: 'Invoice cannot be sent in current status' },
        { status: 400 }
      );
    }

    // Prepare delivery options
    const deliveryOptions: InvoiceDeliveryOptions = {
      method: 'email',
      recipients,
      subject: subject || `Invoice ${invoice.invoice_number}`,
      message,
      include_pdf,
      include_payment_link,
      schedule_delivery: schedule_at ? new Date(schedule_at) : undefined
    };

    let result;

    if (schedule_at) {
      // Schedule delivery for later
      result = await invoiceDeliveryService.scheduleInvoiceDelivery(
        invoiceId,
        deliveryOptions,
        { scheduled_at: new Date(schedule_at) },
        context
      );

      return NextResponse.json({
        success: true,
        scheduled: true,
        scheduled_id: result.scheduled_id,
        scheduled_at: result.scheduled_at,
        message: 'Invoice delivery scheduled successfully'
      });

    } else {
      // Send immediately
      result = await invoiceDeliveryService.sendInvoice(
        invoiceId,
        deliveryOptions,
        context
      );

      // Update invoice status to sent if successful
      if (result.status === 'sent' && invoice.status !== 'sent') {
        await invoiceService.updateInvoice(
          invoiceId,
          { status: 'sent' },
          context
        );
      }

      return NextResponse.json({
        success: true,
        delivery_id: result.delivery_id,
        status: result.status,
        delivered_to: result.delivered_to,
        failed_recipients: result.failed_recipients,
        delivery_date: result.delivery_date,
        message: result.status === 'sent' 
          ? 'Invoice sent successfully' 
          : 'Invoice delivery failed'
      });
    }

  } catch (error) {
    console.error('Invoice send error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to send invoice',
        success: false
      },
      { status: 500 }
    );
  }
}

// Get delivery history for invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's tenant context
    const { data: userTenant, error: tenantError } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (tenantError || !userTenant) {
      return NextResponse.json(
        { error: 'User tenant not found' },
        { status: 403 }
      );
    }

    const context: TenantContext = {
      tenant_id: userTenant.tenant_id,
      user_id: user.id
    };

    // Get delivery history
    const history = await invoiceDeliveryService.getDeliveryHistory(invoiceId, context);

    return NextResponse.json({
      success: true,
      delivery_history: history
    });

  } catch (error) {
    console.error('Get delivery history error:', error);
    return NextResponse.json(
      { error: 'Failed to get delivery history' },
      { status: 500 }
    );
  }
}