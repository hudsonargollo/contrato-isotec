/**
 * Invoice Approval API Route
 * Handles invoice approval and rejection requests
 * Requirements: 4.2 - Customer approval workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { invoiceApprovalWorkflowService } from '@/lib/services/invoice-approval-workflows';
import { invoiceService } from '@/lib/services/invoice';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { InvoiceApprovalRequest } from '@/lib/types/invoice';

export async function POST(
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

    const invoiceId = params.id;
    const body = await request.json();

    // Validate request body
    const approvalRequest: InvoiceApprovalRequest = {
      invoice_id: invoiceId,
      action: body.action,
      comments: body.comments,
      conditions_met: body.conditions_met
    };

    if (!['approve', 'reject'].includes(approvalRequest.action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get the current workflow execution for this invoice
    const workflowExecution = await invoiceApprovalWorkflowService.getInvoiceWorkflowExecution(
      invoiceId,
      context
    );

    if (!workflowExecution) {
      // No workflow execution found - use direct approval
      const invoice = await invoiceService.approveInvoice(
        invoiceId,
        approvalRequest,
        context
      );

      return NextResponse.json({
        success: true,
        invoice,
        message: `Invoice ${approvalRequest.action}d successfully`
      });
    }

    if (workflowExecution.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invoice is not pending approval' },
        { status: 400 }
      );
    }

    // Process the approval through the workflow
    const updatedExecution = await invoiceApprovalWorkflowService.processApproval(
      workflowExecution.id,
      approvalRequest,
      context
    );

    // Get updated invoice
    const invoice = await invoiceService.getInvoice(invoiceId, context);

    return NextResponse.json({
      success: true,
      invoice,
      workflow_execution: updatedExecution,
      message: `Invoice ${approvalRequest.action}d successfully`
    });

  } catch (error) {
    console.error('Invoice approval error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process approval',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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

    const invoiceId = params.id;

    // Get invoice details
    const invoice = await invoiceService.getInvoice(invoiceId, context);
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Get workflow execution if exists
    const workflowExecution = await invoiceApprovalWorkflowService.getInvoiceWorkflowExecution(
      invoiceId,
      context
    );

    // Get workflow details if execution exists
    let workflow = null;
    if (workflowExecution) {
      workflow = await invoiceApprovalWorkflowService.getWorkflow(
        workflowExecution.workflow_id,
        context
      );
    }

    return NextResponse.json({
      invoice,
      workflow_execution: workflowExecution,
      workflow,
      can_approve: workflowExecution?.status === 'pending' || invoice.status === 'pending_approval'
    });

  } catch (error) {
    console.error('Get invoice approval details error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get approval details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}