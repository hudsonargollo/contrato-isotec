/**
 * Screening Rules API Routes
 * Handles CRUD operations for screening rules
 * Requirements: 3.2 - Configurable scoring rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { screeningService } from '@/lib/services/screening';
import { createScreeningRuleSchema } from '@/lib/types/screening';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active') !== 'false'; // Default to true

    const rules = await screeningService.getScreeningRules(tenantId, activeOnly);
    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching screening rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch screening rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = createScreeningRuleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid rule data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const rule = await screeningService.createScreeningRule(tenantId, validationResult.data);
    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating screening rule:', error);
    return NextResponse.json(
      { error: 'Failed to create screening rule' },
      { status: 500 }
    );
  }
}