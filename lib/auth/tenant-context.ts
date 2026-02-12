import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export interface TenantContext {
  tenantId: string;
  userId: string;
  userRole: string;
  permissions: string[];
}

/**
 * Get tenant context from authenticated user session
 * This function extracts tenant information from the user's session
 * and provides context for multi-tenant operations
 */
export async function getTenantContext(): Promise<TenantContext> {
  const supabase = await createSupabaseClient();
  
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    redirect('/auth/login');
  }

  const { user } = session;

  // Get user profile with tenant information
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      id,
      tenant_id,
      role,
      permissions,
      tenants (
        id,
        name,
        status
      )
    `)
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Failed to load user profile');
  }

  // Ensure user has an active tenant
  if (!profile.tenant_id || profile.tenants?.status !== 'active') {
    redirect('/onboarding/tenant-setup');
  }

  return {
    tenantId: profile.tenant_id,
    userId: user.id,
    userRole: profile.role || 'user',
    permissions: profile.permissions || [],
  };
}

/**
 * Validate tenant access for API routes
 * Ensures the user has access to the specified tenant
 */
export async function validateTenantAccess(
  requiredTenantId?: string,
  requiredPermissions: string[] = []
): Promise<TenantContext> {
  const context = await getTenantContext();

  // Check tenant access
  if (requiredTenantId && context.tenantId !== requiredTenantId) {
    throw new Error('Access denied: Invalid tenant');
  }

  // Check permissions
  if (requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.some(permission =>
      context.permissions.includes(permission) ||
      context.userRole === 'admin' ||
      context.userRole === 'owner'
    );

    if (!hasPermission) {
      throw new Error('Access denied: Insufficient permissions');
    }
  }

  return context;
}

/**
 * Get tenant-scoped Supabase client
 * Returns a Supabase client with RLS context set for the current tenant
 */
export async function getTenantSupabaseClient() {
  const context = await getTenantContext();
  const supabase = await createSupabaseClient();

  // Set RLS context for tenant isolation
  await supabase.rpc('set_tenant_context', {
    tenant_id: context.tenantId,
    user_id: context.userId,
    user_role: context.userRole
  });

  return { supabase, context };
}

/**
 * Middleware helper for API routes
 * Provides tenant context validation for API endpoints
 */
export function withTenantAuth(
  handler: (context: TenantContext, ...args: any[]) => Promise<Response>,
  options: {
    requiredPermissions?: string[];
    requiredRole?: string;
  } = {}
) {
  return async (...args: any[]): Promise<Response> => {
    try {
      const context = await validateTenantAccess(undefined, options.requiredPermissions);

      // Check role requirement
      if (options.requiredRole && context.userRole !== options.requiredRole) {
        return new Response(
          JSON.stringify({ error: 'Access denied: Insufficient role' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return await handler(context, ...args);
    } catch (error) {
      console.error('Tenant auth error:', error);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}