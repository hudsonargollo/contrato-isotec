/**
 * RBAC Permission Check API
 * 
 * API endpoint for checking user permissions dynamically.
 * Supports resource-specific permission checking and audit logging.
 * 
 * Requirements: 8.1, 8.4 - User Management and Permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rbacService } from '@/lib/services/rbac';
import { z } from 'zod';

const permissionCheckSchema = z.object({
  permission: z.string(),
  resource_id: z.string().optional(),
  resource_type: z.string().optional(),
  context: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get tenant ID from headers
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant context required' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = permissionCheckSchema.parse(body);

    // Check permission
    const hasPermission = await rbacService.checkPermission(
      user.id,
      tenantId,
      {
        permission: validatedData.permission,
        resource_id: validatedData.resource_id,
        resource_type: validatedData.resource_type,
        context: validatedData.context,
      }
    );

    // Audit the permission check
    await rbacService.auditPermissionCheck(
      user.id,
      tenantId,
      {
        permission: validatedData.permission,
        resource_id: validatedData.resource_id,
        resource_type: validatedData.resource_type,
        context: validatedData.context,
      },
      hasPermission,
      {
        request_url: request.url,
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      }
    );

    return NextResponse.json({
      success: true,
      hasPermission,
      permission: validatedData.permission,
      resource_id: validatedData.resource_id,
      resource_type: validatedData.resource_type,
    });

  } catch (error) {
    console.error('Error in permission check:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Bulk permission check
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get tenant ID from headers
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant context required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { permissions } = body;

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissions must be an array' },
        { status: 400 }
      );
    }

    // Check multiple permissions
    const results = await rbacService.checkMultiplePermissions(
      user.id,
      tenantId,
      permissions
    );

    return NextResponse.json({
      success: true,
      permissions: results,
    });

  } catch (error) {
    console.error('Error in bulk permission check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}