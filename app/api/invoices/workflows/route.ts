/**
 * Invoice Approval Workflows API Route
 * Handles approval workflow management
 * Requirements: 4.2 - Customer approval workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getTenantContext } from '@/lib/utils/tenant-context';
import { InvoiceApprovalWorkflow } from '@/lib/types/invoice';
import { auditLogger } from '@/lib/services/audit-log';

export async function GET(request: NextRequest) {
  try {
    const context = await getTenantContext(request);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    await supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    const { data: workflows, error } = await supabase
      .from('invoice_approval_workflows')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch workflows: ${error.message}`);
    }

    // Log the activity
    await auditLogger.log({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'workflows.list',
      resource_type: 'workflow',
      details: {
        workflow_count: workflows?.length || 0
      }
    });

    return NextResponse.json(workflows || []);
  } catch (error) {
    console.error('Error fetching approval workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approval workflows' },
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

    const body = await request.json();

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Workflow name is required' },
        { status: 400 }
      );
    }

    // Validate approval steps
    if (!body.approval_steps || !Array.isArray(body.approval_steps)) {
      return NextResponse.json(
        { error: 'Approval steps are required' },
        { status: 400 }
      );
    }

    // Validate each approval step
    for (const step of body.approval_steps) {
      if (!step.approver_role && !step.approver_user_id) {
        return NextResponse.json(
          { error: 'Each approval step must have either an approver role or user ID' },
          { status: 400 }
        );
      }
    }

    const supabase = createClient();
    await supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    // If this is set as default, unset other defaults first
    if (body.is_default) {
      await supabase
        .from('invoice_approval_workflows')
        .update({ is_default: false })
        .eq('tenant_id', context.tenant_id)
        .eq('is_default', true);
    }

    const { data: workflow, error } = await supabase
      .from('invoice_approval_workflows')
      .insert({
        tenant_id: context.tenant_id,
        name: body.name.trim(),
        description: body.description?.trim(),
        approval_steps: body.approval_steps,
        auto_approve_threshold: body.auto_approve_threshold || null,
        require_approval_above: body.require_approval_above || null,
        conditions: body.conditions || [],
        is_active: body.is_active !== false,
        is_default: body.is_default || false,
        created_by: context.user_id
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create workflow: ${error.message}`);
    }

    // Log the activity
    await auditLogger.log({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'workflows.create',
      resource_type: 'workflow',
      resource_id: workflow.id,
      details: {
        workflow_name: workflow.name,
        approval_steps_count: workflow.approval_steps?.length || 0,
        is_default: workflow.is_default,
        is_active: workflow.is_active,
        auto_approve_threshold: workflow.auto_approve_threshold,
        require_approval_above: workflow.require_approval_above
      }
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error('Error creating approval workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create approval workflow' },
      { status: 500 }
    );
  }
}