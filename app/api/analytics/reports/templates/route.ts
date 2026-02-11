/**
 * Report Templates API Route
 * Requirements: 6.3 - Automated report generation
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
    const isActive = searchParams.get('active');

    // Get report templates
    let query = supabase
      .from('report_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (reportType) {
      query = query.eq('report_type', reportType);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: templates, error } = await query;

    if (error) {
      throw new Error(`Failed to get report templates: ${error.message}`);
    }

    return NextResponse.json({ templates: templates || [] });

  } catch (error) {
    console.error('Failed to get report templates:', error);
    return NextResponse.json(
      { error: 'Failed to get report templates' },
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
    const {
      name,
      description,
      report_type = 'custom',
      config,
      template_data,
      schedule_config,
      is_active = true
    } = body;

    if (!name || !config || !template_data) {
      return NextResponse.json(
        { error: 'Missing required fields: name, config, template_data' },
        { status: 400 }
      );
    }

    // Create report template
    const { data: template, error } = await supabase
      .from('report_templates')
      .insert({
        tenant_id: tenantId,
        name,
        description,
        report_type,
        config,
        template_data,
        is_active
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create report template: ${error.message}`);
    }

    // If schedule is provided, create scheduled report
    if (schedule_config) {
      const scheduledReportId = await advancedReportingService.createScheduledReport(
        { tenant_id: tenantId, user_id: user.id },
        {
          name,
          description,
          report_type,
          config,
          template_data,
          is_active
        },
        schedule_config
      );

      return NextResponse.json({
        template,
        scheduled_report_id: scheduledReportId
      });
    }

    return NextResponse.json({ template });

  } catch (error) {
    console.error('Failed to create report template:', error);
    return NextResponse.json(
      { error: 'Failed to create report template' },
      { status: 500 }
    );
  }
}