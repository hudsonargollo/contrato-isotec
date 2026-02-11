/**
 * Qualification Rules API Routes
 * Manages automated lead qualification rules based on screening results
 * Requirements: 3.4 - Integrate screening with CRM pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crmScreeningIntegrationService } from '@/lib/services/crm-screening-integration';

// GET /api/crm/screening-integration/qualification-rules - Get qualification rules
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active_only') !== 'false';

    const rules = await crmScreeningIntegrationService.getQualificationRules(
      tenantUser.tenant_id,
      activeOnly
    );

    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching qualification rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch qualification rules' },
      { status: 500 }
    );
  }
}

// POST /api/crm/screening-integration/qualification-rules - Create qualification rule
export async function POST(request: NextRequest) {
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

    const ruleData = await request.json();

    const rule = await crmScreeningIntegrationService.createQualificationRule(
      tenantUser.tenant_id,
      ruleData
    );

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating qualification rule:', error);
    return NextResponse.json(
      { error: 'Failed to create qualification rule' },
      { status: 500 }
    );
  }
}