/**
 * RBAC Middleware
 * 
 * Middleware functions for enforcing role-based access control in API routes and components.
 * Provides permission checking, role validation, and access control enforcement.
 * 
 * Requirements: 8.1, 8.4 - User Management and Permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rbacService, UserContext } from '@/lib/services/rbac';
import { UserRole } from '@/lib/types/tenant';

export interface RBACMiddlewareOptions {
  requiredPermission?: string;
  requiredRole?: UserRole;
  allowOwnerOnly?: boolean;
  resourceType?: string;
  resourceIdParam?: string;
  skipTenantCheck?: boolean;
}

/**
 * RBAC middleware for API routes
 */
export async function withRBAC(
  request: NextRequest,
  options: RBACMiddlewareOptions,
  handler: (request: NextRequest, userContext: UserContext) => Promise<NextResponse>
): Promise<NextResponse> {
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

    // Get tenant ID from URL or headers
    const tenantId = getTenantIdFromRequest(request);
    if (!tenantId && !options.skipTenantCheck) {
      return NextResponse.json(
        { error: 'Tenant context required' },
        { status: 400 }
      );
    }

    // Get user context
    const userContext = await rbacService.getUserContext(user.id, tenantId!);
    if (!userContext) {
      return NextResponse.json(
        { error: 'Access denied: No tenant access' },
        { status: 403 }
      );
    }

    // Check if user is active
    if (!userContext.is_active) {
      return NextResponse.json(
        { error: 'Access denied: User account inactive' },
        { status: 403 }
      );
    }

    // Owner-only check
    if (options.allowOwnerOnly && userContext.role !== 'owner') {
      return NextResponse.json(
        { error: 'Access denied: Owner access required' },
        { status: 403 }
      );
    }

    // Role-based check
    if (options.requiredRole) {
      const userRoleLevel = rbacService['roleHierarchy'][userContext.role].level;
      const requiredRoleLevel = rbacService['roleHierarchy'][options.requiredRole].level;
      
      if (userRoleLevel < requiredRoleLevel) {
        return NextResponse.json(
          { error: `Access denied: ${options.requiredRole} role required` },
          { status: 403 }
        );
      }
    }

    // Permission-based check
    if (options.requiredPermission) {
      let resourceId: string | undefined;
      
      // Extract resource ID from URL parameters
      if (options.resourceIdParam) {
        const url = new URL(request.url);
        const pathSegments = url.pathname.split('/');
        const paramIndex = pathSegments.findIndex(segment => segment === options.resourceIdParam);
        if (paramIndex !== -1 && pathSegments[paramIndex + 1]) {
          resourceId = pathSegments[paramIndex + 1];
        }
      }

      const hasPermission = await rbacService.checkPermission(
        user.id,
        tenantId!,
        {
          permission: options.requiredPermission,
          resource_id: resourceId,
          resource_type: options.resourceType
        }
      );

      if (!hasPermission) {
        // Audit the failed permission check
        await rbacService.auditPermissionCheck(
          user.id,
          tenantId!,
          {
            permission: options.requiredPermission,
            resource_id: resourceId,
            resource_type: options.resourceType
          },
          false,
          { request_url: request.url, method: request.method }
        );

        return NextResponse.json(
          { error: `Access denied: ${options.requiredPermission} permission required` },
          { status: 403 }
        );
      }

      // Audit successful permission check
      await rbacService.auditPermissionCheck(
        user.id,
        tenantId!,
        {
          permission: options.requiredPermission,
          resource_id: resourceId,
          resource_type: options.resourceType
        },
        true,
        { request_url: request.url, method: request.method }
      );
    }

    // Call the handler with user context
    return handler(request, userContext);

  } catch (error) {
    console.error('RBAC middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Extract tenant ID from request
 */
function getTenantIdFromRequest(request: NextRequest): string | null {
  // Try to get tenant ID from URL path
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  
  // Look for tenant ID in common patterns
  const tenantIndex = pathSegments.findIndex(segment => segment === 'tenants');
  if (tenantIndex !== -1 && pathSegments[tenantIndex + 1]) {
    return pathSegments[tenantIndex + 1];
  }

  // Try to get from headers
  const tenantIdHeader = request.headers.get('x-tenant-id');
  if (tenantIdHeader) {
    return tenantIdHeader;
  }

  // Try to get from query parameters
  const tenantIdQuery = url.searchParams.get('tenant_id');
  if (tenantIdQuery) {
    return tenantIdQuery;
  }

  return null;
}

/**
 * Higher-order function for creating RBAC-protected API handlers
 */
export function requirePermission(permission: string, options?: Omit<RBACMiddlewareOptions, 'requiredPermission'>) {
  return function (handler: (request: NextRequest, userContext: UserContext) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      return withRBAC(request, { ...options, requiredPermission: permission }, handler);
    };
  };
}

/**
 * Higher-order function for creating role-protected API handlers
 */
export function requireRole(role: UserRole, options?: Omit<RBACMiddlewareOptions, 'requiredRole'>) {
  return function (handler: (request: NextRequest, userContext: UserContext) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      return withRBAC(request, { ...options, requiredRole: role }, handler);
    };
  };
}

/**
 * Higher-order function for owner-only API handlers
 */
export function requireOwner(options?: Omit<RBACMiddlewareOptions, 'allowOwnerOnly'>) {
  return function (handler: (request: NextRequest, userContext: UserContext) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      return withRBAC(request, { ...options, allowOwnerOnly: true }, handler);
    };
  };
}

/**
 * Middleware for checking resource ownership
 */
export function requireResourceAccess(
  resourceType: string,
  resourceIdParam: string = 'id',
  permission: string
) {
  return function (handler: (request: NextRequest, userContext: UserContext) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      return withRBAC(
        request,
        {
          requiredPermission: permission,
          resourceType,
          resourceIdParam
        },
        handler
      );
    };
  };
}

/**
 * Utility function to check permissions in server components
 */
export async function checkServerPermission(
  userId: string,
  tenantId: string,
  permission: string,
  resourceId?: string,
  resourceType?: string
): Promise<boolean> {
  try {
    return await rbacService.checkPermission(userId, tenantId, {
      permission,
      resource_id: resourceId,
      resource_type: resourceType
    });
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Get user context for server components
 */
export async function getServerUserContext(
  userId: string,
  tenantId: string
): Promise<UserContext | null> {
  try {
    return await rbacService.getUserContext(userId, tenantId);
  } catch (error) {
    console.error('User context error:', error);
    return null;
  }
}