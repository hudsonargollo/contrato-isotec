/**
 * Pending Approvals API Route
 * Handles retrieval of pending approvals for users
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
    const userId = searchParams.get('user_id') || context.user_id;

    // Get pending approvals for the user
    const pendingApprovals = await invoiceApprovalWorkflowService.getPendingApprovals(
      userId,
      context
    );

    return NextResponse.json({
      pending_approvals: pendingApprovals,
      count: pendingApprovals.length
    });

  } catch (error) {
    console.error('Get pending approvals error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get pending approvals',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}