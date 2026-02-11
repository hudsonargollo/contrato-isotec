/**
 * CRM Lead Scoring Rules API
 * Handles configurable lead scoring system
 * Requirements: 2.3 - Lead scoring and qualification system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crmService } from '@/lib/services/crm';
import type { CreateScoringRuleRequest } from '@/lib/types/crm';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant context
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') !== 'false';

    const rules = await crmService.getScoringRules(tenantId, activeOnly);

    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching scoring rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scoring rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant context
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const data: CreateScoringRuleRequest = await request.json();

    // Validate required fields
    if (!data.name || !data.field_name || !data.operator || data.score_points === undefined) {
      return NextResponse.json(
        { error: 'Name, field name, operator, and score points are required' },
        { status: 400 }
      );
    }

    const rule = await crmService.createScoringRule(tenantId, data);

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating scoring rule:', error);
    return NextResponse.json(
      { error: 'Failed to create scoring rule' },
      { status: 500 }
    );
  }
}