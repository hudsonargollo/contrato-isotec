/**
 * Tenant Context Provider
 * 
 * React context for managing tenant state and providing tenant-specific
 * functionality throughout the application. Handles tenant switching,
 * permission checking, and branding application.
 * 
 * Requirements: 1.1, 1.2, 1.5 - Multi-Tenant Architecture
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Tenant, 
  TenantContext as TenantContextType, 
  TenantUser, 
  UserRole,
  getUserPermissions,
  hasPermission as checkPermission,
  hasFeature as checkFeature
} from '@/lib/types/tenant';

interface TenantProviderProps {
  children: React.ReactNode;
  initialTenant?: Tenant;
  initialTenantUser?: TenantUser;
}

interface TenantContextValue {
  // Current tenant state
  tenant: Tenant | null;
  tenantUser: TenantUser | null;
  context: TenantContextType | null;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions
  switchTenant: (tenantId: string) => Promise<void>;
  refreshTenant: () => Promise<void>;
  
  // Utility functions
  hasPermission: (permission: string) => boolean;
  hasFeature: (feature: string) => boolean;
  isOwner: () => boolean;
  isAdmin: () => boolean;
  canManageUsers: () => boolean;
  
  // Branding
  getBrandingCSS: () => string;
  getPrimaryColor: () => string;
  getSecondaryColor: () => string;
  getLogoUrl: () => string;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children, initialTenant, initialTenantUser }: TenantProviderProps) {
  const [tenant, setTenant] = useState<Tenant | null>(initialTenant || null);
  const [tenantUser, setTenantUser] = useState<TenantUser | null>(initialTenantUser || null);
  const [context, setContext] = useState<TenantContextType | null>(null);
  const [loading, setLoading] = useState(!initialTenant);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  // Build tenant context from current state
  const buildContext = useCallback((tenant: Tenant, tenantUser: TenantUser): TenantContextType => {
    const userPermissions = getUserPermissions(tenantUser.role, tenantUser.permissions);
    
    return {
      tenant_id: tenant.id,
      user_id: tenantUser.user_id,
      role: tenantUser.role,
      permissions: userPermissions,
      subscription_limits: tenant.subscription.limits,
      features: tenant.subscription.features,
      branding: tenant.branding,
      settings: tenant.settings
    };
  }, []);

  // Load tenant data for current user
  const loadTenantData = useCallback(async (tenantId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('tenant_users')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      } else {
        // Get user's primary tenant (first by role priority, then by join date)
        query = query.order('role', { ascending: true }).order('joined_at', { ascending: true }).limit(1);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      if (!data || data.length === 0) {
        throw new Error('No tenant access found for user');
      }

      const tenantUserData = data[0];
      const tenantData = tenantUserData.tenant;

      if (!tenantData) {
        throw new Error('Tenant data not found');
      }

      // Parse JSONB fields
      const parsedTenant: Tenant = {
        ...tenantData,
        branding: typeof tenantData.branding === 'string' 
          ? JSON.parse(tenantData.branding) 
          : tenantData.branding,
        subscription: typeof tenantData.subscription === 'string'
          ? JSON.parse(tenantData.subscription)
          : tenantData.subscription,
        settings: typeof tenantData.settings === 'string'
          ? JSON.parse(tenantData.settings)
          : tenantData.settings,
        created_at: new Date(tenantData.created_at),
        updated_at: new Date(tenantData.updated_at)
      };

      const parsedTenantUser: TenantUser = {
        ...tenantUserData,
        permissions: typeof tenantUserData.permissions === 'string'
          ? JSON.parse(tenantUserData.permissions)
          : tenantUserData.permissions,
        invited_at: tenantUserData.invited_at ? new Date(tenantUserData.invited_at) : undefined,
        joined_at: new Date(tenantUserData.joined_at),
        last_active_at: new Date(tenantUserData.last_active_at),
        created_at: new Date(tenantUserData.created_at),
        updated_at: new Date(tenantUserData.updated_at)
      };

      setTenant(parsedTenant);
      setTenantUser(parsedTenantUser);
      setContext(buildContext(parsedTenant, parsedTenantUser));

      // Update last active timestamp
      await supabase
        .from('tenant_users')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', parsedTenantUser.id);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tenant data';
      setError(errorMessage);
      console.error('Error loading tenant data:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, buildContext]);

  // Switch to a different tenant
  const switchTenant = useCallback(async (tenantId: string) => {
    await loadTenantData(tenantId);
  }, [loadTenantData]);

  // Refresh current tenant data
  const refreshTenant = useCallback(async () => {
    if (tenant) {
      await loadTenantData(tenant.id);
    } else {
      await loadTenantData();
    }
  }, [tenant, loadTenantData]);

  // Permission checking
  const hasPermission = useCallback((permission: string): boolean => {
    if (!context) return false;
    return checkPermission(context.permissions, permission);
  }, [context]);

  // Feature checking
  const hasFeature = useCallback((feature: string): boolean => {
    if (!tenant) return false;
    return checkFeature(tenant.subscription, feature);
  }, [tenant]);

  // Role checking utilities
  const isOwner = useCallback((): boolean => {
    return tenantUser?.role === 'owner';
  }, [tenantUser]);

  const isAdmin = useCallback((): boolean => {
    return tenantUser?.role === 'admin' || isOwner();
  }, [tenantUser, isOwner]);

  const canManageUsers = useCallback((): boolean => {
    return isAdmin() || hasPermission('users.create') || hasPermission('users.invite');
  }, [isAdmin, hasPermission]);

  // Branding utilities
  const getBrandingCSS = useCallback((): string => {
    if (!tenant?.branding.custom_css) return '';
    return tenant.branding.custom_css;
  }, [tenant]);

  const getPrimaryColor = useCallback((): string => {
    return tenant?.branding.primary_color || '#2563eb';
  }, [tenant]);

  const getSecondaryColor = useCallback((): string => {
    return tenant?.branding.secondary_color || '#64748b';
  }, [tenant]);

  const getLogoUrl = useCallback((): string => {
    return tenant?.branding.logo_url || '';
  }, [tenant]);

  // Load initial tenant data on mount
  useEffect(() => {
    if (!initialTenant) {
      loadTenantData();
    }
  }, [initialTenant, loadTenantData]);

  // Apply custom CSS when tenant changes
  useEffect(() => {
    if (tenant?.branding.custom_css) {
      const styleId = 'tenant-custom-css';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      styleElement.textContent = tenant.branding.custom_css;
    }

    // Apply CSS custom properties for colors
    if (tenant?.branding) {
      document.documentElement.style.setProperty('--tenant-primary', tenant.branding.primary_color);
      document.documentElement.style.setProperty('--tenant-secondary', tenant.branding.secondary_color);
    }

    return () => {
      // Cleanup on unmount
      const styleElement = document.getElementById('tenant-custom-css');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [tenant]);

  const value: TenantContextValue = {
    tenant,
    tenantUser,
    context,
    loading,
    error,
    switchTenant,
    refreshTenant,
    hasPermission,
    hasFeature,
    isOwner,
    isAdmin,
    canManageUsers,
    getBrandingCSS,
    getPrimaryColor,
    getSecondaryColor,
    getLogoUrl
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

// Hook to use tenant context
export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

// Hook to check if user has specific permission
export function usePermission(permission: string): boolean {
  const { hasPermission } = useTenant();
  return hasPermission(permission);
}

// Hook to check if tenant has specific feature
export function useFeature(feature: string): boolean {
  const { hasFeature } = useTenant();
  return hasFeature(feature);
}

// Hook to get tenant branding
export function useTenantBranding() {
  const { tenant, getPrimaryColor, getSecondaryColor, getLogoUrl, getBrandingCSS } = useTenant();
  
  return {
    branding: tenant?.branding,
    primaryColor: getPrimaryColor(),
    secondaryColor: getSecondaryColor(),
    logoUrl: getLogoUrl(),
    customCSS: getBrandingCSS(),
    isWhiteLabel: tenant?.branding.white_label || false
  };
}

// Hook for role-based access control
export function useRole() {
  const { tenantUser, isOwner, isAdmin, canManageUsers } = useTenant();
  
  return {
    role: tenantUser?.role,
    isOwner: isOwner(),
    isAdmin: isAdmin(),
    canManageUsers: canManageUsers(),
    isManager: tenantUser?.role === 'manager',
    isUser: tenantUser?.role === 'user',
    isViewer: tenantUser?.role === 'viewer'
  };
}