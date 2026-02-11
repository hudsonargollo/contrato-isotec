/**
 * Advanced Reports API Route
 * Requirements: 6.3, 6.4, 6.5 - Advanced reporting and forecasting
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { advancedReportingService } from '@/lib/services/advanced-reporting';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.user_metadata?.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get reports for tenant
    let query = supabase
      .from('analytics_reports')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (reportType) {
      query = query.eq('report_type', reportType);
    }

    const { data: reports, error } = await query;

    if (error) {
      throw new Error(`Failed to get reports: ${error.message}`);
    }

    return NextResponse.json({ reports: reports || [] });

  } catch (error) {
    console.error('Failed to get reports:', error);
    return NextResponse.json(
      { error: 'Failed to get reports' },
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

    const tenantId = user.user_metadata?.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const body = await request.json();
    const { template_id, time_range, name, description } = body;

    if (!template_id) {
      return NextResponse.json(
        { error: 'Missing required field: template_id' },
        { status: 400 }
      );
    }

    // Generate report
    const report = await advancedReportingService.generateReport(
      { tenant_id: tenantId, user_id: user.id },
      template_id,
      time_range
    );

    return NextResponse.json({ report });

  } catch (error) {
    console.error('Failed to generate report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}