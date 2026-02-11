/**
 * Audit Report Download API Route
 * 
 * Handles report file downloads with proper authentication and authorization.
 * Supports various report formats (JSON, CSV, PDF).
 * 
 * Requirements: 8.5, 12.3 - User Management and Security Compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auditService } from '@/lib/services/audit';
import { rbacService } from '@/lib/services/rbac';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const reportId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';

    // Get report
    const report = await auditService.getAuditReport(reportId);

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Check if report is completed
    if (report.status !== 'completed') {
      return NextResponse.json(
        { error: `Report is not ready. Status: ${report.status}` },
        { status: 400 }
      );
    }

    // Check if report has expired
    if (report.expires_at && new Date(report.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Report has expired' },
        { status: 410 }
      );
    }

    // Check permissions
    const hasPermission = await rbacService.checkPermission(
      user.id,
      report.tenant_id,
      { permission: 'analytics.view' }
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if user can access this report
    const isOwner = report.generated_by === user.id;
    const isAdmin = await rbacService.checkPermission(
      user.id,
      report.tenant_id,
      { permission: 'analytics.export' }
    );

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Generate file content based on format
    let content: string;
    let contentType: string;
    let filename: string;

    switch (format.toLowerCase()) {
      case 'csv':
        content = generateCSV(report);
        contentType = 'text/csv';
        filename = `${report.report_name}.csv`;
        break;
      case 'json':
        content = JSON.stringify(report.report_data, null, 2);
        contentType = 'application/json';
        filename = `${report.report_name}.json`;
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported format' },
          { status: 400 }
        );
    }

    // Log the download activity
    await auditService.logActivity(
      'data.export',
      {
        tenant_id: report.tenant_id,
        user_id: user.id,
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1'
      },
      {
        resource_type: 'report',
        resource_id: reportId,
        resource_name: report.report_name,
        metadata: {
          report_type: report.report_type,
          format,
          file_size: content.length
        }
      }
    );

    // Return file download
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': content.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading audit report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate CSV content from report data
 */
function generateCSV(report: any): string {
  if (!report.report_data) {
    return 'No data available';
  }

  const data = report.report_data;
  
  // Handle different report types
  switch (report.report_type) {
    case 'user_activity':
      return generateActivityCSV(data.activities || []);
    case 'security_events':
      return generateSecurityEventsCSV(data.events || []);
    case 'login_history':
      return generateLoginHistoryCSV(data.logins || []);
    case 'compliance_summary':
      return generateComplianceCSV(data);
    default:
      return JSON.stringify(data, null, 2);
  }
}

/**
 * Generate CSV for user activities
 */
function generateActivityCSV(activities: any[]): string {
  if (activities.length === 0) {
    return 'No activities found';
  }

  const headers = [
    'Timestamp',
    'User ID',
    'Action',
    'Resource Type',
    'Resource ID',
    'Resource Name',
    'Status',
    'IP Address',
    'Duration (ms)',
    'Error Message'
  ];

  const rows = activities.map(activity => [
    new Date(activity.created_at).toISOString(),
    activity.user_id || '',
    activity.action,
    activity.resource_type || '',
    activity.resource_id || '',
    activity.resource_name || '',
    activity.status,
    activity.ip_address,
    activity.duration_ms || '',
    activity.error_message || ''
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

/**
 * Generate CSV for security events
 */
function generateSecurityEventsCSV(events: any[]): string {
  if (events.length === 0) {
    return 'No security events found';
  }

  const headers = [
    'Timestamp',
    'Event Type',
    'Severity',
    'Description',
    'User ID',
    'IP Address',
    'Status',
    'Resolved At',
    'Resolved By'
  ];

  const rows = events.map(event => [
    new Date(event.created_at).toISOString(),
    event.event_type,
    event.severity,
    event.description,
    event.user_id || '',
    event.ip_address || '',
    event.status,
    event.resolved_at ? new Date(event.resolved_at).toISOString() : '',
    event.resolved_by || ''
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

/**
 * Generate CSV for login history
 */
function generateLoginHistoryCSV(logins: any[]): string {
  if (logins.length === 0) {
    return 'No login history found';
  }

  const headers = [
    'Timestamp',
    'User ID',
    'IP Address',
    'User Agent',
    'Status',
    'Session ID'
  ];

  const rows = logins.map(login => [
    new Date(login.created_at).toISOString(),
    login.user_id || '',
    login.ip_address,
    login.user_agent || '',
    login.status,
    login.session_id || ''
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

/**
 * Generate CSV for compliance summary
 */
function generateComplianceCSV(data: any): string {
  const summary = data.compliance_summary || {};
  
  const rows = [
    ['Metric', 'Value'],
    ['Report Period Start', summary.date_range?.start_date || ''],
    ['Report Period End', summary.date_range?.end_date || ''],
    ['Total Activities', summary.total_activities || 0],
    ['Security Events', summary.security_events || 0],
    ['Critical Events', summary.critical_events || 0],
    ['Unique Users', summary.unique_users || 0]
  ];

  return rows
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}