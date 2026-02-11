/**
 * Overdue Approvals API Route
 * Handles retrieval and management of overdue approvals
 * Requirements: 4.2 - Customer approval workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { invoiceApprovalWorkflowService } from '@/lib/services/invoice-approval-workflows';
import { getTenantContext } from '@/lib/utils/tenant-context';

export async function GET(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const daysPending = parseInt(searchParams.get('days_pending') || '7');

    // Get overdue approvals
    const overdueApprovals = await invoiceApprovalWorkflowService.getOverdueApprovals(
      daysPending,
      context
    );

    return NextResponse.json({
      overdue_approvals: overdueApprovals,
      count: overdueApprovals.length,
      days_pending: daysPending
    });

  } catch (error) {
    console.error('Get overdue approvals error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get overdue approvals',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const daysPending = body.days_pending || 7;

    // Send overdue reminders
    await invoiceApprovalWorkflowService.sendOverdueReminders(
      daysPending,
      context
    );

    return NextResponse.json({
      success: true,
      message: `Overdue reminders sent for approvals pending ${daysPending} days or more`
    });

  } catch (error) {
    console.error('Send overdue reminders error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send overdue reminders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}