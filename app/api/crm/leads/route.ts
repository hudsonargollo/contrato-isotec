/**
 * CRM Leads API Routes
 * Handles CRUD operations for leads
 * Requirements: 2.1 - Lead capture and creation workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crmService } from '@/lib/services/crm';
import { trackCustomEvent, recordCustomMetric } from '@/lib/middleware/analytics';
import type { CreateLeadRequest, LeadFilters, LeadSortOptions } from '@/lib/types/crm';

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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    // Filters
    const filters: LeadFilters = {};
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!.split(',') as any[];
    }
    if (searchParams.get('stage_id')) {
      filters.stage_id = searchParams.get('stage_id')!.split(',');
    }
    if (searchParams.get('source_id')) {
      filters.source_id = searchParams.get('source_id')!.split(',');
    }
    if (searchParams.get('assigned_to')) {
      filters.assigned_to = searchParams.get('assigned_to')!.split(',');
    }
    if (searchParams.get('priority')) {
      filters.priority = searchParams.get('priority')!.split(',') as any[];
    }
    if (searchParams.get('tags')) {
      filters.tags = searchParams.get('tags')!.split(',');
    }
    if (searchParams.get('score_min')) {
      filters.score_min = parseInt(searchParams.get('score_min')!);
    }
    if (searchParams.get('score_max')) {
      filters.score_max = parseInt(searchParams.get('score_max')!);
    }
    if (searchParams.get('created_after')) {
      filters.created_after = new Date(searchParams.get('created_after')!);
    }
    if (searchParams.get('created_before')) {
      filters.created_before = new Date(searchParams.get('created_before')!);
    }
    if (searchParams.get('search_query')) {
      filters.search_query = searchParams.get('search_query')!;
    }
    if (searchParams.get('search_fields')) {
      filters.search_fields = searchParams.get('search_fields')!.split(',') as any[];
    }

    // Sorting
    const sort: LeadSortOptions = {
      field: (searchParams.get('sort_field') as any) || 'created_at',
      direction: (searchParams.get('sort_direction') as any) || 'desc'
    };

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await crmService.getLeads(tenantId, filters, sort, page, limit);

    // Track analytics event
    await trackCustomEvent(
      request,
      'leads_viewed',
      'crm',
      'view',
      {
        filters_applied: Object.keys(filters).length,
        page,
        limit,
        total_results: result.total
      },
      'lead'
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
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

    const data: CreateLeadRequest = await request.json();

    // Validate required fields
    if (!data.first_name || !data.last_name) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    const lead = await crmService.createLead(tenantId, data);

    // Track analytics event
    await trackCustomEvent(
      request,
      'lead_created',
      'crm',
      'create',
      {
        source: data.source_id || 'direct',
        priority: data.priority || 'medium',
        has_phone: !!data.phone,
        has_email: !!data.email
      },
      'lead',
      lead.id
    );

    // Record metric
    await recordCustomMetric(
      request,
      'leads_created',
      1,
      'counter',
      'crm',
      {
        source: data.source_id || 'direct',
        priority: data.priority || 'medium'
      }
    );

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}