/**
 * Tenant Users API Routes
 * 
 * API endpoints for managing tenant users, roles, and permissions.
 * Supports user listing, invitation, role assignment, and permission management.
 * 
 * Requirements: 8.1, 8.4 - User Management and Permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/middleware/rbac';
import { inviteTenantUserSchema, updateTenantUserSchema } from '@/lib/types/tenant';
import { z } from 'zod';

// Get tenant users
export const GET = requirePermission('users.view')(
  async (request: NextRequest, userContext) => {
    try {
      const supabase = await createClient();
      const tenantId = userContext.tenant_id;

      // Get tenant users with user profile information
      const { data: tenantUsers, error } = await supabase
        .from('tenant_users')
        .select(`
          *,
          user_profile:profiles(email, full_name, avatar_url)
        `)
        .eq('tenant_id', tenantId)
        .order('role', { ascending: true })
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching tenant users:', error);
        return NextResponse.json(
          { error: 'Failed to fetch users' },
          { status: 500 }
        );
      }

      // Get additional user information from auth.users if needed
      const usersWithDetails = await Promise.all(
        tenantUsers.map(async (tenantUser) => {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(tenantUser.user_id);
            
            return {
              ...tenantUser,
              email: tenantUser.user_profile?.email || authUser.user?.email,
              full_name: tenantUser.user_profile?.full_name || authUser.user?.user_metadata?.full_name,
              last_sign_in_at: authUser.user?.last_sign_in_at,
              permissions: typeof tenantUser.permissions === 'string' 
                ? JSON.parse(tenantUser.permissions) 
                : tenantUser.permissions || []
            };
          } catch (err) {
            console.error('Error fetching user details:', err);
            return {
              ...tenantUser,
              email: tenantUser.user_profile?.email || 'Unknown',
              full_name: tenantUser.user_profile?.full_name || 'Unknown User',
              permissions: typeof tenantUser.permissions === 'string' 
                ? JSON.parse(tenantUser.permissions) 
                : tenantUser.permissions || []
            };
          }
        })
      );

      return NextResponse.json({
        success: true,
        users: usersWithDetails
      });

    } catch (error) {
      console.error('Error in GET /api/tenants/[id]/users:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

// Invite user to tenant
export const POST = requirePermission('users.invite')(
  async (request: NextRequest, userContext) => {
    try {
      const supabase = await createClient();
      const tenantId = userContext.tenant_id;
      const body = await request.json();

      // Validate request body
      const validatedData = inviteTenantUserSchema.parse(body);

      // Check if user can assign this role
      const rbacService = (await import('@/lib/services/rbac')).rbacService;
      const canAssignRole = rbacService.canAssignRole(userContext.role, validatedData.role);
      
      if (!canAssignRole) {
        return NextResponse.json(
          { error: `Cannot assign ${validatedData.role} role` },
          { status: 403 }
        );
      }

      // Check if user already exists
      const { data: existingUser, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        console.error('Error checking existing users:', userError);
        return NextResponse.json(
          { error: 'Failed to check existing users' },
          { status: 500 }
        );
      }

      const userExists = existingUser.users.find(u => u.email === validatedData.email);
      let userId: string;

      if (userExists) {
        userId = userExists.id;
        
        // Check if user is already in this tenant
        const { data: existingTenantUser } = await supabase
          .from('tenant_users')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('user_id', userId)
          .single();

        if (existingTenantUser) {
          return NextResponse.json(
            { error: 'User is already a member of this tenant' },
            { status: 400 }
          );
        }
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: validatedData.email,
          email_confirm: !validatedData.send_invitation, // Auto-confirm if not sending invitation
          user_metadata: {
            invited_to_tenant: tenantId,
            invited_role: validatedData.role
          }
        });

        if (createError || !newUser.user) {
          console.error('Error creating user:', createError);
          return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
          );
        }

        userId = newUser.user.id;
      }

      // Add user to tenant
      const { data: tenantUser, error: tenantUserError } = await supabase
        .from('tenant_users')
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          role: validatedData.role,
          permissions: JSON.stringify(validatedData.permissions),
          status: userExists ? 'active' : 'pending',
          invited_by: userContext.user_id,
          invited_at: new Date().toISOString(),
          joined_at: userExists ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (tenantUserError) {
        console.error('Error adding user to tenant:', tenantUserError);
        return NextResponse.json(
          { error: 'Failed to add user to tenant' },
          { status: 500 }
        );
      }

      // Log the invitation
      await supabase
        .from('audit_logs')
        .insert({
          tenant_id: tenantId,
          user_id: userContext.user_id,
          action: 'user.invited',
          resource_type: 'user',
          resource_id: userId,
          metadata: {
            invited_email: validatedData.email,
            assigned_role: validatedData.role,
            send_invitation: validatedData.send_invitation
          }
        });

      // TODO: Send invitation email if validatedData.send_invitation is true

      return NextResponse.json({
        success: true,
        user: {
          ...tenantUser,
          permissions: JSON.parse(tenantUser.permissions || '[]')
        }
      });

    } catch (error) {
      console.error('Error in POST /api/tenants/[id]/users:', error);

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
);