/**
 * Approval Workflows Management API Route
 * Handles CRUD operations for invoice approval workflows
 * Requirements: 4.2 - Customer approval workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { invoiceApprovalWorkflowService } from '@/lib/services/invoice-approval-workflows';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { CreateWorkflowRequest } from '@/lib/services/invoice-approval-workflows';

export async function GET(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const workflows = await invoiceApprovalWorkflowService.getWorkflows(context);

    return NextResponse.json({
      workflows
    });

  } catch (error) {
    console.error('Get workflows error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get workflows',
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

    // Validate request body
    const createRequest: CreateWorkflowRequest = {
      name: body.name,
      description: body.description,
      approval_steps: body.approval_steps || [],
      auto_approve_threshold: body.auto_approve_threshold,
      require_approval_above: body.require_approval_above,
      conditions: body.conditions || [],
      is_default: body.is_default
    };

    // Validate required fields
    if (!createRequest.name || !createRequest.name.trim()) {
      return NextResponse.json(
        { error: 'Workflow name is required' },
        { status: 400 }
      );
    }

    if (!createRequest.approval_steps || createRequest.approval_steps.length === 0) {
      return NextResponse.json(
        { error: 'At least one approval step is required' },
        { status: 400 }
      );
    }

    // Validate approval steps
    for (const step of createRequest.approval_steps) {
      if (!step.approver_role && !step.approver_user_id) {
        return NextResponse.json(
          { error: 'Each approval step must have either approver_role or approver_user_id' },
          { status: 400 }
        );
      }
    }

    const workflow = await invoiceApprovalWorkflowService.createWorkflow(
      createRequest,
      context
    );

    return NextResponse.json({
      success: true,
      workflow,
      message: 'Workflow created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create workflow error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}