/**
 * Security Events API Route
 * 
 * Provides CRUD operations for security events with filtering,
 * pagination, and incident management capabilities.
 * 
 * Requirements: 8.5, 12.3 - User Management and Security Compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auditService } from '@/lib/services/audit';
import { rbacService } from '@/lib/services/rbac';
import { securityEventQuerySchema, updateSecurityEventSchema } from '@/lib/types/audit';

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
      tenant_id: searchParams.get('tenant_id') || undefined,
      user_id: searchParams.get('user_id') || undefined,
      event_type: searchParams.get('event_type') || undefined,
      severity: searchParams.get('severity') || undefined,
      status: searchParams.get('status') || undefined,
      start_date: searchParams.get('start_date') ? new Date(searchParams.get('start_date')!) : undefined,
      end_date: searchParams.get('end_date') ? new Date(searchParams.get('end_date')!) : undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    // Validate query parameters
    const validationResult = securityEventQuerySchema.safeParse(queryData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const query = validationResult.data;

    // Check permissions - require admin access for security events
    if (query.tenant_id) {
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
    }

    // Get security events
    const result = await auditService.getSecurityEvents(query);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching security events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventId, ...updates } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Validate update data
    const validationResult = updateSecurityEventSchema.safeParse(updates);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid update data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Add resolved_by if resolving the event
    if (updateData.status === 'resolved') {
      updateData.resolved_by = user.id;
    }

    // Update security event
    const success = await auditService.updateSecurityEvent(eventId, updateData);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update security event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating security event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}