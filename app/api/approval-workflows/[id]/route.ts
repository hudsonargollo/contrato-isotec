/**
 * Individual Approval Workflow API Route
 * Handles operations on specific approval workflows
 * Requirements: 4.2 - Customer approval workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { invoiceApprovalWorkflowService } from '@/lib/services/invoice-approval-workflows';
import { getTenantContext } from '@/lib/utils/tenant-context';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const workflowId = params.id;
    const workflow = await invoiceApprovalWorkflowService.getWorkflow(workflowId, context);

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      workflow
    });

  } catch (error) {
    console.error('Get workflow error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}