/**
 * Individual Invoice Approval Workflow API Route
 * Handles individual workflow operations
 * Requirements: 4.2 - Customer approval workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getTenantContext } from '@/lib/utils/tenant-context';
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

    const supabase = createClient();
    await supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    const { data: workflow, error } = await supabase
      .from('invoice_approval_workflows')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
      }
      throw new Error(`Failed to fetch workflow: ${error.message}`);
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error fetching approval workflow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approval workflow' },
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

    const body = await request.json();

    // Validate required fields if provided
    if (body.name !== undefined && !body.name?.trim()) {
      return NextResponse.json(
        { error: 'Workflow name cannot be empty' },
        { status: 400 }
      );
    }

    // Validate approval steps if provided
    if (body.approval_steps !== undefined) {
      if (!Array.isArray(body.approval_steps)) {
        return NextResponse.json(
          { error: 'Approval steps must be an array' },
          { status: 400 }
        );
      }

      for (const step of body.approval_steps) {
        if (!step.approver_role && !step.approver_user_id) {
          return NextResponse.json(
            { error: 'Each approval step must have either an approver role or user ID' },
            { status: 400 }
          );
        }
      }
    }

    const supabase = createClient();
    await supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    // If this is being set as default, unset other defaults first
    if (body.is_default) {
      await supabase
        .from('invoice_approval_workflows')
        .update({ is_default: false })
        .eq('tenant_id', context.tenant_id)
        .eq('is_default', true)
        .neq('id', params.id);
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Only update provided fields
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim();
    if (body.approval_steps !== undefined) updateData.approval_steps = body.approval_steps;
    if (body.auto_approve_threshold !== undefined) updateData.auto_approve_threshold = body.auto_approve_threshold;
    if (body.require_approval_above !== undefined) updateData.require_approval_above = body.require_approval_above;
    if (body.conditions !== undefined) updateData.conditions = body.conditions;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.is_default !== undefined) updateData.is_default = body.is_default;

    const { data: workflow, error } = await supabase
      .from('invoice_approval_workflows')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
      }
      throw new Error(`Failed to update workflow: ${error.message}`);
    }

    // Log the activity
    await auditLogger.log({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'workflows.update',
      resource_type: 'workflow',
      resource_id: workflow.id,
      details: {
        workflow_name: workflow.name,
        updated_fields: Object.keys(updateData).filter(key => key !== 'updated_at'),
        is_default: workflow.is_default,
        is_active: workflow.is_active
      }
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error updating approval workflow:', error);
    return NextResponse.json(
      { error: 'Failed to update approval workflow' },
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

    const supabase = createClient();
    await supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    // Get workflow details before deletion for logging
    const { data: workflow, error: fetchError } = await supabase
      .from('invoice_approval_workflows')
      .select('name, is_default')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
      }
      throw new Error(`Failed to fetch workflow: ${fetchError.message}`);
    }

    // Prevent deletion of default workflow if it's the only one
    if (workflow.is_default) {
      const { data: otherWorkflows, error: countError } = await supabase
        .from('invoice_approval_workflows')
        .select('id')
        .neq('id', params.id);

      if (countError) {
        throw new Error(`Failed to check other workflows: ${countError.message}`);
      }

      if (!otherWorkflows || otherWorkflows.length === 0) {
        return NextResponse.json(
          { error: 'Cannot delete the only workflow. Create another workflow first.' },
          { status: 400 }
        );
      }
    }

    const { error } = await supabase
      .from('invoice_approval_workflows')
      .delete()
      .eq('id', params.id);

    if (error) {
      throw new Error(`Failed to delete workflow: ${error.message}`);
    }

    // Log the activity
    await auditLogger.log({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'workflows.delete',
      resource_type: 'workflow',
      resource_id: params.id,
      details: {
        workflow_name: workflow.name,
        was_default: workflow.is_default
      }
    });

    return NextResponse.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Error deleting approval workflow:', error);
    return NextResponse.json(
      { error: 'Failed to delete approval workflow' },
      { status: 500 }
    );
  }
}