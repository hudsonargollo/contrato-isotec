/**
 * Invoice Workflow Management API Route
 * Handles starting and managing approval workflows for invoices
 * Requirements: 4.2 - Customer approval workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { invoiceApprovalWorkflowService } from '@/lib/services/invoice-approval-workflows';
import { invoiceService } from '@/lib/services/invoice';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { StartWorkflowRequest } from '@/lib/services/invoice-approval-workflows';

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

    // Validate invoice exists
    const invoice = await invoiceService.getInvoice(invoiceId, context);
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if workflow already exists
    const existingExecution = await invoiceApprovalWorkflowService.getInvoiceWorkflowExecution(
      invoiceId,
      context
    );

    if (existingExecution && existingExecution.status === 'pending') {
      return NextResponse.json(
        { error: 'Workflow already in progress for this invoice' },
        { status: 400 }
      );
    }

    // Start new workflow
    const startRequest: StartWorkflowRequest = {
      invoice_id: invoiceId,
      workflow_id: body.workflow_id,
      skip_auto_approval: body.skip_auto_approval
    };

    const workflowExecution = await invoiceApprovalWorkflowService.startWorkflow(
      startRequest,
      context
    );

    // Get updated invoice
    const updatedInvoice = await invoiceService.getInvoice(invoiceId, context);

    return NextResponse.json({
      success: true,
      workflow_execution: workflowExecution,
      invoice: updatedInvoice,
      message: 'Approval workflow started successfully'
    });

  } catch (error) {
    console.error('Start workflow error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start workflow',
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

    // Get workflow execution
    const workflowExecution = await invoiceApprovalWorkflowService.getInvoiceWorkflowExecution(
      invoiceId,
      context
    );

    if (!workflowExecution) {
      return NextResponse.json(
        { error: 'No workflow found for this invoice' },
        { status: 404 }
      );
    }

    // Get workflow details
    const workflow = await invoiceApprovalWorkflowService.getWorkflow(
      workflowExecution.workflow_id,
      context
    );

    return NextResponse.json({
      workflow_execution: workflowExecution,
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