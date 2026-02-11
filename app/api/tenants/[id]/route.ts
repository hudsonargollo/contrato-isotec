/**
 * Individual Tenant API Routes
 * 
 * API endpoints for managing individual tenants.
 * Handles tenant retrieval, updates, and deletion.
 * 
 * Requirements: 1.1, 1.2, 1.5 - Multi-Tenant Architecture
 */

import { NextRequest, NextResponse } from 'next/server';
import { TenantService } from '@/lib/services/tenant';
import { updateTenantSchema } from '@/lib/types/tenant';
import { createTenantSupabaseClient, getCurrentTenant, hasPermission } from '@/lib/utils/tenant-context';

const tenantService = new TenantService();

/**
 * GET /api/tenants/[id]
 * Get tenant details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createTenantSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = params.id;
    const tenant = await tenantService.getTenant(tenantId);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check access permissions
    let hasAccess = false;

    // Check if user is super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile && profile.role === 'super_admin') {
      hasAccess = true;
    }

    // Check if user is member of this tenant
    if (!hasAccess) {
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('role, status')
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (tenantUser) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('Error getting tenant:', error);
    return NextResponse.json(
      { error: 'Failed to get tenant' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tenants/[id]
 * Update tenant details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createTenantSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = params.id;
    const tenant = await tenantService.getTenant(tenantId);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check update permissions
    let canUpdate = false;

    // Check if user is super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile && profile.role === 'super_admin') {
      canUpdate = true;
    }

    // Check if user is owner/admin of this tenant
    if (!canUpdate) {
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('role, status')
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (tenantUser && ['owner', 'admin'].includes(tenantUser.role)) {
        canUpdate = true;
      }
    }

    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = updateTenantSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Update tenant
    const updatedTenant = await tenantService.updateTenant(tenantId, updateData);

    return NextResponse.json({ tenant: updatedTenant });
  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tenants/[id]
 * Delete tenant (super admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createTenantSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins can delete tenants
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantId = params.id;
    const tenant = await tenantService.getTenant(tenantId);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Delete tenant
    await tenantService.deleteTenant(tenantId);

    return NextResponse.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    );
  }
}