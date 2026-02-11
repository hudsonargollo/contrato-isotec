/**
 * User Registration API Route
 * 
 * Handles user registration with tenant context and role assignment.
 * Supports both admin user creation and tenant user invitation.
 * 
 * Requirements: 8.1, 12.2 - User Management and Authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Registration request schema
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  role: z.enum(['admin', 'super_admin']).optional().default('admin'),
  tenantId: z.string().uuid().optional(),
  tenantRole: z.enum(['owner', 'admin', 'manager', 'user', 'viewer']).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const supabase = await createClient();

    // Check if user is authenticated and has permission to create users
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if current user has permission to create users
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    const canCreateUsers = currentProfile?.role === 'super_admin' || 
      (validatedData.tenantId && await checkTenantPermission(supabase, currentUser.id, validatedData.tenantId, 'users.create'));

    if (!canCreateUsers) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create users' },
        { status: 403 }
      );
    }

    // Create the user account
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      user_metadata: {
        full_name: validatedData.fullName,
        role: validatedData.role
      },
      email_confirm: true // Auto-confirm email for admin-created users
    });

    if (signUpError || !authData.user) {
      if (signUpError?.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Este email já está cadastrado' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Erro ao criar usuário: ' + signUpError?.message },
        { status: 400 }
      );
    }

    // Create profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        full_name: validatedData.fullName,
        role: validatedData.role,
        mfa_enabled: false
      });

    if (profileError) {
      // Clean up the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: 'Erro ao criar perfil do usuário' },
        { status: 500 }
      );
    }

    // If tenant ID is provided, add user to tenant
    if (validatedData.tenantId && validatedData.tenantRole) {
      const { error: tenantUserError } = await supabase
        .from('tenant_users')
        .insert({
          tenant_id: validatedData.tenantId,
          user_id: authData.user.id,
          role: validatedData.tenantRole,
          status: 'active',
          invited_by: currentUser.id,
          joined_at: new Date().toISOString()
        });

      if (tenantUserError) {
        console.error('Error adding user to tenant:', tenantUserError);
        // Don't fail the entire registration, just log the error
      }
    }

    // Update tenant usage metrics
    if (validatedData.tenantId) {
      await supabase.rpc('update_tenant_usage', {
        tenant_id_param: validatedData.tenantId,
        metric_name_param: 'users_count',
        increment_value: 1
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: validatedData.fullName,
        role: validatedData.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Helper function to check tenant permissions
async function checkTenantPermission(
  supabase: any,
  userId: string,
  tenantId: string,
  permission: string
): Promise<boolean> {
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('role, permissions')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!tenantUser) return false;

  // Owner and admin have all permissions
  if (['owner', 'admin'].includes(tenantUser.role)) {
    return true;
  }

  // Check specific permission
  const permissions = tenantUser.permissions || [];
  return permissions.includes(permission) || permissions.includes('users.*');
}