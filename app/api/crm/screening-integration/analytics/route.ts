/**
 * Screening-CRM Analytics API Routes
 * Generates analytics reports combining screening and CRM data
 * Requirements: 3.4 - Integrate screening with CRM pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crmScreeningIntegrationService } from '@/lib/services/crm-screening-integration';

// GET /api/crm/screening-integration/analytics - Get analytics reports
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
    const reportType = searchParams.get('report_type');

    const reports = await crmScreeningIntegrationService.getScreeningCRMReports(
      tenantUser.tenant_id,
      reportType || undefined
    );

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching analytics reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics reports' },
      { status: 500 }
    );
  }
}

// POST /api/crm/screening-integration/analytics - Generate analytics report
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
    const { report_type, start_date, end_date, report_name } = body;

    if (!report_type || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'report_type, start_date, and end_date are required' },
        { status: 400 }
      );
    }

    const report = await crmScreeningIntegrationService.generateScreeningCRMReport(
      tenantUser.tenant_id,
      report_type,
      new Date(start_date),
      new Date(end_date),
      report_name
    );

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error generating analytics report:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics report' },
      { status: 500 }
    );
  }
}