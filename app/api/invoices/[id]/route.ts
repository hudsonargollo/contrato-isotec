/**
 * Individual Invoice API Routes
 * Handles single invoice operations
 * Requirements: 4.1, 4.2, 4.3, 4.4 - Invoice Management System
 */

import { NextRequest, NextResponse } from 'next/server';
import { invoiceService } from '@/lib/services/invoice';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { UpdateInvoiceRequest } from '@/lib/types/invoice';
import { auditLogger } from '@/lib/services/audit-log';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoice = await invoiceService.getInvoice(params.id, context);
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Log the activity
    await auditLogger.log({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'invoices.view',
      resource_type: 'invoice',
      resource_id: invoice.id,
      details: {
        invoice_number: invoice.invoice_number,
        customer_name: invoice.customer_name
      }
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateInvoiceRequest = await request.json();

    // Validate items if provided
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

    const invoice = await invoiceService.updateInvoice(params.id, body, context);

    // Log the activity
    await auditLogger.log({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'invoices.update',
      resource_type: 'invoice',
      resource_id: invoice.id,
      details: {
        invoice_number: invoice.invoice_number,
        customer_name: invoice.customer_name,
        updated_fields: Object.keys(body)
      }
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get invoice details before deletion for logging
    const invoice = await invoiceService.getInvoice(params.id, context);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if invoice can be deleted (not paid)
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Cannot delete paid invoices' },
        { status: 400 }
      );
    }

    await invoiceService.deleteInvoice(params.id, context);

    // Log the activity
    await auditLogger.log({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'invoices.delete',
      resource_type: 'invoice',
      resource_id: invoice.id,
      details: {
        invoice_number: invoice.invoice_number,
        customer_name: invoice.customer_name,
        total_amount: invoice.total_amount
      }
    });

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}