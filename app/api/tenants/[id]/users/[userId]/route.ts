/**
 * Individual Tenant User API Routes
 * 
 * API endpoints for managing individual tenant users.
 * Supports user updates, role changes, and user removal.
 * 
 * Requirements: 8.1, 8.4 - User Management and Permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/middleware/rbac';
import { updateTenantUserSchema } from '@/lib/types/tenant';
import { z } from 'zod';

// Get specific tenant user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const supabase = await createClient();
    const { id: tenantId, userId } = params;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user has access to this tenant
    const { data: currentUserAccess } = await supabase
      .from('tenant_users')
      .select('role, permissions')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!currentUserAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get the requested user
    const { data: tenantUser, error } = await supabase
      .from('tenant_users')
      .select(`
        *,
        user_profile:profiles(email, full_name, avatar_url)
      `)
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();

    if (error || !tenantUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get additional user information
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);

    const userWithDetails = {
      ...tenantUser,
      email: tenantUser.user_profile?.email || authUser.user?.email,
      full_name: tenantUser.user_profile?.full_name || authUser.user?.user_metadata?.full_name,
      last_sign_in_at: authUser.user?.last_sign_in_at,
      permissions: typeof tenantUser.permissions === 'string' 
        ? JSON.parse(tenantUser.permissions) 
        : tenantUser.permissions || []
    };

    return NextResponse.json({
      success: true,
      user: userWithDetails
    });

  } catch (error) {
    console.error('Error in GET /api/tenants/[id]/users/[userId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update tenant user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const supabase = await createClient();
    const { id: tenantId, userId } = params;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's context
    const { data: currentUserAccess } = await supabase
      .from('tenant_users')
      .select('role, permissions')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!currentUserAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if current user has permission to update users
    const currentPermissions = typeof currentUserAccess.permissions === 'string' 
      ? JSON.parse(currentUserAccess.permissions) 
      : currentUserAccess.permissions || [];
    
    const hasUpdatePermission = currentPermissions.includes('users.update') || 
                               ['owner', 'admin', 'manager'].includes(currentUserAccess.role);

    if (!hasUpdatePermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get the target user
    const { data: targetUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateTenantUserSchema.parse(body);

    // Check if current user can manage the target user
    const rbacService = (await import('@/lib/services/rbac')).rbacService;
    const canManage = await rbacService.canManageUser(
      user.id,
      userId,
      tenantId,
      'update'
    );

    if (!canManage) {
      return NextResponse.json(
        { error: 'Cannot manage this user' },
        { status: 403 }
      );
    }

    // If changing role, check if current user can assign the new role
    if (validatedData.role) {
      const canAssignRole = rbacService.canAssignRole(currentUserAccess.role, validatedData.role);
      
      if (!canAssignRole) {
        return NextResponse.json(
          { error: `Cannot assign ${validatedData.role} role` },
          { status: 403 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (validatedData.role) {
      updateData.role = validatedData.role;
    }

    if (validatedData.permissions) {
      updateData.permissions = JSON.stringify(validatedData.permissions);
    }

    if (validatedData.status) {
      updateData.status = validatedData.status;
    }

    // Update the user
    const { data: updatedUser, error: updateError } = await supabase
      .from('tenant_users')
      .update(updateData)
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating tenant user:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Log the update
    await supabase
      .from('audit_logs')
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        action: 'user.updated',
        resource_type: 'user',
        resource_id: userId,
        metadata: {
          updated_fields: Object.keys(validatedData),
          old_role: targetUser.role,
          new_role: validatedData.role
        }
      });

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        permissions: typeof updatedUser.permissions === 'string' 
          ? JSON.parse(updatedUser.permissions) 
          : updatedUser.permissions || []
      }
    });

  } catch (error) {
    console.error('Error in PUT /api/tenants/[id]/users/[userId]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Remove user from tenant
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const supabase = await createClient();
    const { id: tenantId, userId } = params;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's context
    const { data: currentUserAccess } = await supabase
      .from('tenant_users')
      .select('role, permissions')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!currentUserAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if current user has permission to delete users
    const currentPermissions = typeof currentUserAccess.permissions === 'string' 
      ? JSON.parse(currentUserAccess.permissions) 
      : currentUserAccess.permissions || [];
    
    const hasDeletePermission = currentPermissions.includes('users.delete') || 
                               ['owner', 'admin'].includes(currentUserAccess.role);

    if (!hasDeletePermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get the target user
    const { data: targetUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if current user can manage the target user
    const rbacService = (await import('@/lib/services/rbac')).rbacService;
    const canManage = await rbacService.canManageUser(
      user.id,
      userId,
      tenantId,
      'delete'
    );

    if (!canManage) {
      return NextResponse.json(
        { error: 'Cannot remove this user' },
        { status: 403 }
      );
    }

    // Prevent removing the last owner
    if (targetUser.role === 'owner') {
      const { data: ownerCount } = await supabase
        .from('tenant_users')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('role', 'owner')
        .eq('status', 'active');

      if (ownerCount && ownerCount.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner' },
          { status: 400 }
        );
      }
    }

    // Remove the user from tenant
    const { error: deleteError } = await supabase
      .from('tenant_users')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error removing user from tenant:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove user' },
        { status: 500 }
      );
    }

    // Log the removal
    await supabase
      .from('audit_logs')
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        action: 'user.removed',
        resource_type: 'user',
        resource_id: userId,
        metadata: {
          removed_role: targetUser.role
        }
      });

    return NextResponse.json({
      success: true,
      message: 'User removed from tenant'
    });

  } catch (error) {
    console.error('Error in DELETE /api/tenants/[id]/users/[userId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}