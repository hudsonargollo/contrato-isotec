/**
 * Audit Dashboard API Route
 * 
 * Provides dashboard metrics and summary data for the audit system.
 * Returns activity counts, security events, and performance metrics.
 * 
 * Requirements: 8.5, 12.3 - User Management and Security Compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auditService } from '@/lib/services/audit';
import { rbacService } from '@/lib/services/rbac';

export async function GET(request: NextRequest) {
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
    const tenantId = searchParams.get('tenant_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Check permissions
    const hasPermission = await rbacService.checkPermission(
      user.id,
      tenantId,
      { permission: 'analytics.view' }
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse dates
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;

    // Get dashboard metrics
    const metrics = await auditService.getDashboardMetrics(
      tenantId,
      parsedStartDate,
      parsedEndDate
    );

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching audit dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}