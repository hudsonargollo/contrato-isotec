/**
 * Lead Qualification API Routes
 * Handles manual and bulk lead qualification based on screening results
 * Requirements: 3.4 - Integrate screening with CRM pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crmScreeningIntegrationService } from '@/lib/services/crm-screening-integration';

// POST /api/crm/screening-integration/qualify - Qualify lead based on screening
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant context
    const { data: tenantUser, error: tenantError } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (tenantError || !tenantUser) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const { lead_id, qualification_override, notes } = body;

    if (!lead_id) {
      return NextResponse.json({ error: 'lead_id is required' }, { status: 400 });
    }

    const result = await crmScreeningIntegrationService.qualifyLeadFromScreening(
      lead_id,
      qualification_override,
      notes
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error qualifying lead:', error);
    return NextResponse.json(
      { error: 'Failed to qualify lead' },
      { status: 500 }
    );
  }
}

// POST /api/crm/screening-integration/qualify/bulk - Bulk qualify leads
export async function PUT(request: NextRequest) {
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

    // Check if user has permission for bulk operations
    if (!['owner', 'admin', 'manager'].includes(tenantUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { criteria } = body;

    if (!criteria) {
      return NextResponse.json({ error: 'criteria is required' }, { status: 400 });
    }

    const result = await crmScreeningIntegrationService.bulkQualifyScreenedLeads(
      tenantUser.tenant_id,
      criteria
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error bulk qualifying leads:', error);
    return NextResponse.json(
      { error: 'Failed to bulk qualify leads' },
      { status: 500 }
    );
  }
}