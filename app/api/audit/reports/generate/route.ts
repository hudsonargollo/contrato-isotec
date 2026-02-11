/**
 * Audit Reports Generation API Route
 * 
 * Generates comprehensive audit reports for compliance and analysis.
 * Supports various report types with customizable filters and date ranges.
 * 
 * Requirements: 8.5, 12.3 - User Management and Security Compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auditService } from '@/lib/services/audit';
import { rbacService } from '@/lib/services/rbac';
import { createAuditReportSchema } from '@/lib/types/audit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const body = await request.json().catch(() => ({}));
    
    // Parse parameters from query string and body
    const reportData = {
      tenant_id: searchParams.get('tenant_id') || body.tenant_id,
      report_type: searchParams.get('report_type') || body.report_type,
      report_name: body.report_name || `${searchParams.get('report_type') || 'audit'}_report_${new Date().toISOString().split('T')[0]}`,
      description: body.description,
      filters: body.filters || {},
      date_range: {
        start_date: searchParams.get('start_date') ? new Date(searchParams.get('start_date')!) : body.date_range?.start_date ? new Date(body.date_range.start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end_date: searchParams.get('end_date') ? new Date(searchParams.get('end_date')!) : body.date_range?.end_date ? new Date(body.date_range.end_date) : new Date()
      },
      generated_by: user.id,
      expires_at: body.expires_at ? new Date(body.expires_at) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    // Validate report data
    const validationResult = createAuditReportSchema.safeParse(reportData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid report parameters', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const reportOptions = validationResult.data;

    // Check permissions
    const hasPermission = await rbacService.checkPermission(
      user.id,
      reportOptions.tenant_id,
      { permission: 'analytics.export' }
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to generate reports' },
        { status: 403 }
      );
    }

    // Generate report
    const reportId = await auditService.generateReport(reportOptions);

    if (!reportId) {
      return NextResponse.json(
        { error: 'Failed to generate report' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      reportId,
      message: 'Report generation started',
      status: 'pending'
    });
  } catch (error) {
    console.error('Error generating audit report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}