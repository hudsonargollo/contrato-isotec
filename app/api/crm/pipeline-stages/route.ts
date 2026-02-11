/**
 * CRM Pipeline Stages API Routes
 * Handles pipeline stage configuration
 * Requirements: 2.2 - Sales pipeline and stage management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crmService } from '@/lib/services/crm';
import type { CreatePipelineStageRequest } from '@/lib/types/crm';

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

    const stages = await crmService.getPipelineStages(tenantId, activeOnly);

    return NextResponse.json(stages);
  } catch (error) {
    console.error('Error fetching pipeline stages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline stages' },
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

    const data: CreatePipelineStageRequest = await request.json();

    // Validate required fields
    if (!data.name || data.stage_order === undefined) {
      return NextResponse.json(
        { error: 'Name and stage order are required' },
        { status: 400 }
      );
    }

    const stage = await crmService.createPipelineStage(tenantId, data);

    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    console.error('Error creating pipeline stage:', error);
    return NextResponse.json(
      { error: 'Failed to create pipeline stage' },
      { status: 500 }
    );
  }
}