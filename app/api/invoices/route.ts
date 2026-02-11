/**
 * Invoice Management API Routes
 * Handles invoice CRUD operations and search
 * Requirements: 4.1, 4.2, 4.3, 4.4 - Invoice Management System
 */

import { NextRequest, NextResponse } from 'next/server';
import { invoiceService } from '@/lib/services/invoice';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { trackCustomEvent, recordCustomMetric } from '@/lib/middleware/analytics';
import { CreateInvoiceRequest, InvoiceFilters, InvoiceSortOptions } from '@/lib/types/invoice';
import { auditLogger } from '@/lib/services/audit-log';

export async function GET(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const filters: InvoiceFilters = {};
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!.split(',') as any[];
    }
    
    if (searchParams.get('customer_id')) {
      filters.customer_id = searchParams.get('customer_id')!.split(',');
    }
    
    if (searchParams.get('search_query')) {
      filters.search_query = searchParams.get('search_query')!;
    }
    
    if (searchParams.get('amount_min')) {
      filters.amount_min = parseFloat(searchParams.get('amount_min')!);
    }
    
    if (searchParams.get('amount_max')) {
      filters.amount_max = parseFloat(searchParams.get('amount_max')!);
    }
    
    if (searchParams.get('due_date_after')) {
      filters.due_date_after = new Date(searchParams.get('due_date_after')!);
    }
    
    if (searchParams.get('due_date_before')) {
      filters.due_date_before = new Date(searchParams.get('due_date_before')!);
    }

    // Parse sorting
    const sort: InvoiceSortOptions = {
      field: (searchParams.get('sort_field') as any) || 'created_at',
      direction: (searchParams.get('sort_direction') as 'asc' | 'desc') || 'desc'
    };

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await invoiceService.searchInvoices(filters, sort, page, limit, context);

    // Log the activity
    await auditLogger.log({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'invoices.list',
      resource_type: 'invoice',
      details: {
        filters,
        sort,
        page,
        limit,
        total_results: result.total
      }
    });

    // Track analytics event
    await trackCustomEvent(
      request,
      'invoices_viewed',
      'invoice',
      'view',
      {
        filters_applied: Object.keys(filters).length,
        page,
        limit,
        total_results: result.total
      },
      'invoice'
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateInvoiceRequest = await request.json();

    // Validate required fields
    if (!body.customer_name) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one invoice item is required' },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of body.items) {
      if (!item.description || item.quantity <= 0 || item.unit_price < 0) {
        return NextResponse.json(
          { error: 'Invalid invoice item data' },
          { status: 400 }
        );
      }
    }

    const invoice = await invoiceService.createInvoice(body, context);

    // Log the activity
    await auditLogger.log({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'invoices.create',
      resource_type: 'invoice',
      resource_id: invoice.id,
      details: {
        invoice_number: invoice.invoice_number,
        customer_name: invoice.customer_name,
        total_amount: invoice.total_amount,
        currency: invoice.currency
      }
    });

    // Track analytics event
    await trackCustomEvent(
      request,
      'invoice_created',
      'invoice',
      'create',
      {
        total_amount: invoice.total_amount,
        currency: invoice.currency,
        item_count: body.items.length,
        has_due_date: !!body.due_date,
        payment_terms: body.payment_terms || 'net_30'
      },
      'invoice',
      invoice.id
    );

    // Record metrics
    await recordCustomMetric(
      request,
      'invoices_created',
      1,
      'counter',
      'invoice',
      {
        currency: invoice.currency,
        payment_terms: body.payment_terms || 'net_30'
      }
    );

    await recordCustomMetric(
      request,
      'invoice_total_amount',
      invoice.total_amount,
      'gauge',
      'invoice',
      {
        currency: invoice.currency
      }
    );

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}