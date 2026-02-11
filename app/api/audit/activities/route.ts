/**
 * User Activities API Route
 * 
 * Provides CRUD operations for user activity logs with filtering,
 * pagination, and search capabilities.
 * 
 * Requirements: 8.5, 12.3 - User Management and Security Compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auditService } from '@/lib/services/audit';
import { rbacService } from '@/lib/services/rbac';
import { auditQuerySchema } from '@/lib/types/audit';

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
    
    // Parse query parameters
    const queryData = {
      tenant_id: searchParams.get('tenant_id'),
      user_id: searchParams.get('user_id') || undefined,
      action: searchParams.get('action') || undefined,
      resource_type: searchParams.get('resource_type') || undefined,
      resource_id: searchParams.get('resource_id') || undefined,
      status: searchParams.get('status') || undefined,
      start_date: searchParams.get('start_date') ? new Date(searchParams.get('start_date')!) : undefined,
      end_date: searchParams.get('end_date') ? new Date(searchParams.get('end_date')!) : undefined,
      ip_address: searchParams.get('ip_address') || undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    // Validate query parameters
    const validationResult = auditQuerySchema.safeParse(queryData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const query = validationResult.data;

    // Check permissions
    const hasPermission = await rbacService.checkPermission(
      user.id,
      query.tenant_id,
      { permission: 'analytics.view' }
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get user activities
    const result = await auditService.getUserActivities(query);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}