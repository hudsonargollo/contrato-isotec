/**
 * Individual Qualification Rule API Routes
 * Manages individual qualification rules
 * Requirements: 3.4 - Integrate screening with CRM pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crmScreeningIntegrationService } from '@/lib/services/crm-screening-integration';

// PUT /api/crm/screening-integration/qualification-rules/[id] - Update qualification rule
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant context and check permissions
    const { data: tenantUser, error: tenantError } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (tenantError || !tenantUser) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check if user has permission to manage qualification rules
    if (!['owner', 'admin', 'manager'].includes(tenantUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const updateData = await request.json();

    const rule = await crmScreeningIntegrationService.updateQualificationRule(
      params.id,
      updateData
    );

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error updating qualification rule:', error);
    return NextResponse.json(
      { error: 'Failed to update qualification rule' },
      { status: 500 }
    );
  }
}

// DELETE /api/crm/screening-integration/qualification-rules/[id] - Delete qualification rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant context and check permissions
    const { data: tenantUser, error: tenantError } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (tenantError || !tenantUser) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check if user has permission to manage qualification rules
    if (!['owner', 'admin', 'manager'].includes(tenantUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await crmScreeningIntegrationService.deleteQualificationRule(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting qualification rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete qualification rule' },
      { status: 500 }
    );
  }
}