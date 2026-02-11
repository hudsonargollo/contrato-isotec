/**
 * Invoice Generation API Route
 * Handles automated invoice generation from contracts and leads
 * Requirements: 4.1 - Invoice Management System
 */

import { NextRequest, NextResponse } from 'next/server';
import { invoiceService } from '@/lib/services/invoice';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { InvoiceGenerationRequest } from '@/lib/types/invoice';
import { auditLogger } from '@/lib/services/audit-log';

export async function POST(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: InvoiceGenerationRequest = await request.json();

    // Validate that we have either contract_id, lead_id, or customer_data
    if (!body.contract_id && !body.lead_id && !body.customer_data) {
      return NextResponse.json(
        { error: 'Either contract_id, lead_id, or customer_data is required' },
        { status: 400 }
      );
    }

    // If manual items are provided, validate them
    if (body.items) {
      for (const item of body.items) {
        if (!item.description || item.quantity <= 0 || item.unit_price < 0) {
          return NextResponse.json(
            { error: 'Invalid invoice item data' },
            { status: 400 }
          );
        }
      }
    }

    const result = await invoiceService.generateInvoice(body, context);

    // Log the activity
    await auditLogger.log({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'invoices.generate',
      resource_type: 'invoice',
      resource_id: result.invoice.id,
      details: {
        invoice_number: result.invoice.invoice_number,
        generated_from: result.generated_from,
        auto_populated_fields: result.auto_populated_fields,
        contract_id: body.contract_id,
        lead_id: body.lead_id,
        auto_approve: body.auto_approve,
        auto_send: body.auto_send,
        warnings: result.warnings,
        total_amount: result.invoice.total_amount
      }
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}