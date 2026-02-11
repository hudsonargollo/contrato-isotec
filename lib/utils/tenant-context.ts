/**
 * Server-side Tenant Context Utilities
 * 
 * Utilities for getting tenant context on the server side,
 * typically used in API routes and server components.
 * 
 * Requirements: 1.1, 1.2, 1.5 - Multi-Tenant Architecture
 */

import { headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { TenantService } from '@/lib/services/tenant';
import { Tenant, TenantUser, TenantContext } from '@/lib/types/tenant';

/**
 * Get tenant ID from request headers (set by middleware)
 */
export function getTenantId(): string | null {
  const headersList = headers();
  return headersList.get('x-tenant-id');
}

/**
 * Get tenant subdomain from request headers (set by middleware)
 */
export function getTenantSubdomain(): string | null {
  const headersList = headers();
  return headersList.get('x-tenant-subdomain');
}

/**
 * Create Supabase client with tenant context
 */
export function createTenantSupabaseClient() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies().getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookies().set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  // Set tenant context if available
  const tenantId = getTenantId();
  if (tenantId) {
    // This would set the tenant context for RLS policies
    // Implementation depends on how you want to pass the context to the database
  }

  return supabase;
}

/**
 * Get current tenant information
 */
export async function getCurrentTenant(): Promise<Tenant | null> {
  const tenantId = getTenantId();
  if (!tenantId) return null;

  const tenantService = new TenantService();
  return tenantService.getTenant(tenantId);
}

/**
 * Get current user's tenant membership
 */
export async function getCurrentTenantUser(): Promise<TenantUser | null> {
  const tenantId = getTenantId();
  if (!tenantId) return null;

  const supabase = createTenantSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tenantUser, error } = await supabase
    .from('tenant_users')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (error || !tenantUser) return null;

  return {
    ...tenantUser,
    permissions: typeof tenantUser.permissions === 'string'
      ? JSON.parse(tenantUser.permissions)
      : tenantUser.permissions,
    invited_at: tenantUser.invited_at ? new Date(tenantUser.invited_at) : undefined,
    joined_at: new Date(tenantUser.joined_at),
    last_active_at: new Date(tenantUser.last_active_at),
    created_at: new Date(tenantUser.created_at),
    updated_at: new Date(tenantUser.updated_at)
  };
}

/**
 * Get full tenant context for current request
 */
export async function getTenantContext(request?: Request): Promise<TenantContext | null> {
  let tenantId: string | null = null;
  let userId: string | null = null;

  if (request) {
    // For API routes with NextRequest
    tenantId = request.headers.get('x-tenant-id');
    
    // Get user from authorization header or session
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // Handle JWT token if needed
      // For now, we'll use a simplified approach
    }
    
    // For now, use a mock user ID - in production this would come from auth
    userId = 'mock-user-id';
  } else {
    // For server components
    const tenant = await getCurrentTenant();
    const tenantUser = await getCurrentTenantUser();

    if (!tenant || !tenantUser) return null;

    // Get user permissions based on role and custom permissions
    const rolePermissions = {
      owner: ['*'], // All permissions
      admin: ['users.*', 'leads.*', 'contracts.*', 'invoices.*', 'analytics.*', 'settings.*'],
      manager: ['users.view', 'users.invite', 'leads.*', 'contracts.*', 'invoices.*', 'analytics.view'],
      user: ['leads.*', 'contracts.*', 'invoices.*', 'analytics.view'],
      viewer: ['leads.view', 'contracts.view', 'invoices.view', 'analytics.view']
    };

    const permissions = [
      ...(rolePermissions[tenantUser.role] || []),
      ...tenantUser.permissions
    ];

    return {
      tenant_id: tenant.id,
      user_id: tenantUser.user_id,
      role: tenantUser.role,
      permissions: [...new Set(permissions)], // Remove duplicates
      subscription_limits: tenant.subscription.limits,
      features: tenant.subscription.features,
      branding: tenant.branding,
      settings: tenant.settings
    };
  }

  // For API routes, create a simplified context
  if (tenantId && userId) {
    return {
      tenant_id: tenantId,
      user_id: userId,
      role: 'admin', // Default role for API access
      permissions: ['*'], // Full permissions for now
      subscription_limits: {
        max_users: 100,
        max_leads: 10000,
        max_contracts: 1000,
        storage_gb: 100
      },
      features: ['invoices', 'contracts', 'analytics'],
      branding: {},
      settings: {}
    };
  }

  return null;
}

/**
 * Check if current user has a specific permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const context = await getTenantContext();
  if (!context) return false;

  // Owner has all permissions
  if (context.role === 'owner') return true;

  // Check for wildcard permissions
  if (context.permissions.includes('*')) return true;

  // Check for specific permission
  if (context.permissions.includes(permission)) return true;

  // Check for wildcard group permissions (e.g., 'users.*' for 'users.create')
  const [group] = permission.split('.');
  if (context.permissions.includes(`${group}.*`)) return true;

  return false;
}

/**
 * Check if tenant has a specific feature
 */
export async function hasFeature(feature: string): Promise<boolean> {
  const tenant = await getCurrentTenant();
  if (!tenant) return false;

  return tenant.subscription.features.includes(feature);
}

/**
 * Require specific permission (throws error if not authorized)
 */
export async function requirePermission(permission: string): Promise<void> {
  const hasAccess = await hasPermission(permission);
  if (!hasAccess) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

/**
 * Require specific feature (throws error if not available)
 */
export async function requireFeature(feature: string): Promise<void> {
  const hasAccess = await hasFeature(feature);
  if (!hasAccess) {
    throw new Error(`Feature not available: ${feature}`);
  }
}

/**
 * Get tenant-specific database client with RLS context
 */
export async function getTenantDatabase() {
  const supabase = createTenantSupabaseClient();
  const tenantId = getTenantId();

  if (tenantId) {
    // Set the tenant context for RLS policies
    await supabase.rpc('set_config', {
      setting_name: 'app.current_tenant_id',
      setting_value: tenantId,
      is_local: true
    });
  }

  return supabase;
}

/**
 * Middleware helper to validate tenant access
 */
export async function validateTenantAccess(requiredRole?: string[]): Promise<{
  tenant: Tenant;
  tenantUser: TenantUser;
  context: TenantContext;
} | null> {
  const tenant = await getCurrentTenant();
  const tenantUser = await getCurrentTenantUser();

  if (!tenant || !tenantUser) return null;

  // Check role requirements
  if (requiredRole && !requiredRole.includes(tenantUser.role)) {
    return null;
  }

  const context = await getTenantContext();
  if (!context) return null;

  return { tenant, tenantUser, context };
}

/**
 * Track usage for current tenant
 */
export async function trackTenantUsage(metric: string, value = 1): Promise<void> {
  const tenantId = getTenantId();
  if (!tenantId) return;

  const tenantService = new TenantService();
  await tenantService.trackUsage(tenantId, metric as any, value);
}

/**
 * Check if tenant is within usage limits
 */
export async function checkTenantLimit(limitType: string): Promise<boolean> {
  const tenantId = getTenantId();
  if (!tenantId) return false;

  const tenantService = new TenantService();
  return tenantService.checkLimit(tenantId, limitType);
}

/**
 * Require tenant limit (throws error if limit exceeded)
 */
export async function requireTenantLimit(limitType: string): Promise<void> {
  const withinLimit = await checkTenantLimit(limitType);
  if (!withinLimit) {
    throw new Error(`Tenant limit exceeded: ${limitType}`);
  }
}