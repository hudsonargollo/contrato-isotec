/**
 * RBAC (Role-Based Access Control) Hook
 * 
 * React hook for managing role-based access control within tenant context.
 * Provides utilities for checking permissions, roles, and feature access.
 * 
 * Requirements: 8.1, 8.4 - User Management and Permissions
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/lib/contexts/tenant-context';
import { useSession } from '@/components/auth/SessionProvider';

export interface RBACContext {
  // User information
  userId: string | null;
  userRole: string | null;
  tenantRole: string | null;
  
  // Permission checking
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  
  // Feature checking
  hasFeature: (feature: string) => boolean;
  hasAnyFeature: (features: string[]) => boolean;
  
  // Convenience methods
  canManageUsers: () => boolean;
  canManageRoles: () => boolean;
  canViewAnalytics: () => boolean;
  canManageSettings: () => boolean;
  
  // Loading state
  loading: boolean;
  error: string | null;
}

export function useRBAC(): RBACContext {
  const { user, profile, loading: sessionLoading } = useSession();
  const { 
    tenant, 
    tenantUser, 
    hasPermission: tenantHasPermission,
    hasFeature: tenantHasFeature,
    loading: tenantLoading 
  } = useTenant();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update loading state
  useEffect(() => {
    setLoading(sessionLoading || tenantLoading);
  }, [sessionLoading, tenantLoading]);

  // Permission checking
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user || !tenant) return false;
    return tenantHasPermission(permission);
  }, [user, tenant, tenantHasPermission]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  // Role checking
  const hasRole = useCallback((role: string): boolean => {
    if (role === 'admin' || role === 'super_admin') {
      return profile?.role === role;
    }
    return tenantUser?.role === role;
  }, [profile, tenantUser]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  }, [hasRole]);

  // Feature checking
  const hasFeature = useCallback((feature: string): boolean => {
    if (!tenant) return false;
    return tenantHasFeature(feature);
  }, [tenant, tenantHasFeature]);

  const hasAnyFeature = useCallback((features: string[]): boolean => {
    return features.some(feature => hasFeature(feature));
  }, [hasFeature]);

  // Convenience methods
  const canManageUsers = useCallback((): boolean => {
    return hasAnyRole(['owner', 'admin']) || hasPermission('users.manage');
  }, [hasAnyRole, hasPermission]);

  const canManageRoles = useCallback((): boolean => {
    return hasAnyRole(['owner', 'admin']) || hasPermission('roles.manage');
  }, [hasAnyRole, hasPermission]);

  const canViewAnalytics = useCallback((): boolean => {
    return hasFeature('analytics') && (
      hasAnyRole(['owner', 'admin', 'manager']) || hasPermission('analytics.view')
    );
  }, [hasFeature, hasAnyRole, hasPermission]);

  const canManageSettings = useCallback((): boolean => {
    return hasAnyRole(['owner', 'admin']) || hasPermission('settings.manage');
  }, [hasAnyRole, hasPermission]);

  return {
    userId: user?.id || null,
    userRole: profile?.role || null,
    tenantRole: tenantUser?.role || null,
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    hasFeature,
    hasAnyFeature,
    canManageUsers,
    canManageRoles,
    canViewAnalytics,
    canManageSettings,
    loading,
    error
  };
}

// Hook for checking specific permission
export function usePermission(permission: string): boolean {
  const { hasPermission } = useRBAC();
  return hasPermission(permission);
}

// Hook for checking specific role
export function useRole(role: string): boolean {
  const { hasRole } = useRBAC();
  return hasRole(role);
}

// Hook for checking specific feature
export function useFeature(feature: string): boolean {
  const { hasFeature } = useRBAC();
  return hasFeature(feature);
}

// Hook for admin-level access
export function useAdminAccess(): {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canAccessAdmin: boolean;
  loading: boolean;
} {
  const { userRole, loading } = useRBAC();
  
  const isAdmin = userRole === 'admin';
  const isSuperAdmin = userRole === 'super_admin';
  const canAccessAdmin = isAdmin || isSuperAdmin;

  return {
    isAdmin,
    isSuperAdmin,
    canAccessAdmin,
    loading
  };
}

// Hook for tenant-level access
export function useTenantAccess(): {
  isOwner: boolean;
  isTenantAdmin: boolean;
  canManageTenant: boolean;
  tenantRole: string | null;
  loading: boolean;
} {
  const { tenantRole, loading } = useRBAC();
  
  const isOwner = tenantRole === 'owner';
  const isTenantAdmin = tenantRole === 'admin';
  const canManageTenant = isOwner || isTenantAdmin;

  return {
    isOwner,
    isTenantAdmin,
    canManageTenant,
    tenantRole,
    loading
  };
}

// Additional hooks for compatibility with existing components
export function useUserManagement() {
  const { canManageUsers, canManageRoles, userId, loading } = useRBAC();
  
  return {
    canManageUsers: canManageUsers(),
    canManageRoles: canManageRoles(),
    userId,
    loading,
    // Mock functions for compatibility
    inviteUser: async () => ({ success: false, error: 'Not implemented' }),
    updateUserRole: async () => ({ success: false, error: 'Not implemented' }),
    removeUser: async () => ({ success: false, error: 'Not implemented' })
  };
}

export function usePermissionGroups() {
  return {
    permissionGroups: [
      {
        name: 'Users',
        permissions: ['users.view', 'users.create', 'users.update', 'users.delete']
      },
      {
        name: 'Leads',
        permissions: ['leads.view', 'leads.create', 'leads.update', 'leads.delete']
      },
      {
        name: 'Contracts',
        permissions: ['contracts.view', 'contracts.create', 'contracts.update', 'contracts.delete']
      },
      {
        name: 'Analytics',
        permissions: ['analytics.view', 'analytics.export']
      }
    ],
    loading: false
  };
}