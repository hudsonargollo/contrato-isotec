/**
 * Stripe Payment Reconciliation API Route
 * Reconciles payments between Stripe and local database
 * Requirements: 4.3 - Payment gateway integration and tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/services/stripe';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { auditLogger } from '@/lib/services/audit-log';

export async function POST(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Parse date range if provided
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (body.start_date) {
      startDate = new Date(body.start_date);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid start_date format' },
          { status: 400 }
        );
      }
    }

    if (body.end_date) {
      endDate = new Date(body.end_date);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end_date format' },
          { status: 400 }
        );
      }
    }

    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { error: 'start_date must be before end_date' },
        { status: 400 }
      );
    }

    // Perform reconciliation
    const reconciliationResult = await stripeService.reconcilePayments(
      context,
      startDate,
      endDate
    );

    // Log the reconciliation activity
    await auditLogger.log({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'payments.reconcile',
      resource_type: 'payment',
      resource_id: 'bulk',
      details: {
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString(),
        processed_payments: reconciliationResult.processed_payments,
        failed_reconciliations: reconciliationResult.failed_reconciliations,
        errors_count: reconciliationResult.errors.length,
      }
    });

    return NextResponse.json({
      message: 'Payment reconciliation completed',
      result: reconciliationResult,
      summary: {
        total_processed: reconciliationResult.processed_payments,
        total_failed: reconciliationResult.failed_reconciliations,
        success_rate: reconciliationResult.processed_payments + reconciliationResult.failed_reconciliations > 0
          ? (reconciliationResult.processed_payments / (reconciliationResult.processed_payments + reconciliationResult.failed_reconciliations)) * 100
          : 100,
      }
    });
  } catch (error) {
    console.error('Error during payment reconciliation:', error);
    
    // Log reconciliation error
    try {
      const context = await getTenantContext(request);
      if (context) {
        await auditLogger.log({
          tenant_id: context.tenant_id,
          user_id: context.user_id,
          action: 'payments.reconcile_error',
          resource_type: 'payment',
          resource_id: 'bulk',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          }
        });
      }
    } catch (logError) {
      console.error('Failed to log reconciliation error:', logError);
    }

    return NextResponse.json(
      { 
        error: 'Payment reconciliation failed',
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

    // This endpoint could return reconciliation status or history
    // For now, return basic information about reconciliation capabilities
    
    return NextResponse.json({
      message: 'Payment reconciliation service is available',
      capabilities: {
        supports_date_range: true,
        supported_currencies: ['BRL', 'USD', 'EUR'],
        max_reconciliation_period_days: 90,
      },
      usage: {
        endpoint: '/api/payments/stripe/reconcile',
        method: 'POST',
        parameters: {
          start_date: 'ISO date string (optional)',
          end_date: 'ISO date string (optional)',
        },
        example: {
          start_date: '2024-01-01T00:00:00Z',
          end_date: '2024-01-31T23:59:59Z',
        }
      }
    });
  } catch (error) {
    console.error('Error getting reconciliation info:', error);
    return NextResponse.json(
      { error: 'Failed to get reconciliation information' },
      { status: 500 }
    );
  }
}