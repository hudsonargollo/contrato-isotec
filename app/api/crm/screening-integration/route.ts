/**
 * CRM-Screening Integration API Routes
 * Handles screening integration with CRM pipeline
 * Requirements: 3.4 - Integrate screening with CRM pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crmScreeningIntegrationService } from '@/lib/services/crm-screening-integration';

// GET /api/crm/screening-integration - Get screened leads
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Parse filters
    const filters: any = {};
    
    if (searchParams.get('screening_qualification')) {
      filters.screening_qualification = searchParams.get('screening_qualification')?.split(',');
    }
    if (searchParams.get('screening_feasibility')) {
      filters.screening_feasibility = searchParams.get('screening_feasibility')?.split(',');
    }
    if (searchParams.get('screening_risk_level')) {
      filters.screening_risk_level = searchParams.get('screening_risk_level')?.split(',');
    }
    if (searchParams.get('min_screening_score')) {
      filters.min_screening_score = parseFloat(searchParams.get('min_screening_score')!);
    }
    if (searchParams.get('max_screening_score')) {
      filters.max_screening_score = parseFloat(searchParams.get('max_screening_score')!);
    }
    if (searchParams.get('screening_completed_after')) {
      filters.screening_completed_after = new Date(searchParams.get('screening_completed_after')!);
    }
    if (searchParams.get('screening_completed_before')) {
      filters.screening_completed_before = new Date(searchParams.get('screening_completed_before')!);
    }

    const result = await crmScreeningIntegrationService.getLeadsWithScreening(
      tenantUser.tenant_id,
      filters,
      page,
      limit
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching screened leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch screened leads' },
      { status: 500 }
    );
  }
}

// POST /api/crm/screening-integration - Create lead from screening
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
    const { screening_result_id, lead_data, questionnaire_response_id } = body;

    let result;

    if (questionnaire_response_id) {
      // Create lead from questionnaire response
      result = await crmScreeningIntegrationService.processQuestionnaireToLead(
        tenantUser.tenant_id,
        questionnaire_response_id,
        lead_data || {}
      );
    } else if (screening_result_id) {
      // Get screening result
      const { data: screeningResult, error: screeningError } = await supabase
        .from('screening_results')
        .select('*')
        .eq('id', screening_result_id)
        .single();

      if (screeningError) {
        return NextResponse.json({ error: 'Screening result not found' }, { status: 404 });
      }

      // Create lead from screening result
      result = await crmScreeningIntegrationService.createLeadFromScreening(
        tenantUser.tenant_id,
        screeningResult,
        lead_data
      );
    } else {
      return NextResponse.json({ error: 'Either screening_result_id or questionnaire_response_id is required' }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating lead from screening:', error);
    return NextResponse.json(
      { error: 'Failed to create lead from screening' },
      { status: 500 }
    );
  }
}