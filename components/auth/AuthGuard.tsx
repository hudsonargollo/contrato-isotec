/**
 * Authentication Guard Component
 * 
 * Provides route protection with authentication and role-based access control.
 * Integrates with session management and tenant context.
 * 
 * Requirements: 8.1, 12.2 - User Management and Authentication
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from './SessionProvider';
import { useTenant } from '@/lib/contexts/tenant-context';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  requireTenant?: boolean;
  requiredPermissions?: string[];
  requiredFeatures?: string[];
  fallbackUrl?: string;
  loadingComponent?: React.ReactNode;
}

export function AuthGuard({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireSuperAdmin = false,
  requireTenant = false,
  requiredPermissions = [],
  requiredFeatures = [],
  fallbackUrl = '/login',
  loadingComponent
}: AuthGuardProps) {
  const router = useRouter();
  const { 
    isAuthenticated, 
    isAdmin, 
    isSuperAdmin, 
    initialLoading: sessionLoading 
  } = useSession();
  
  const { 
    tenant, 
    tenantUser, 
    loading: tenantLoading, 
    hasPermission, 
    hasFeature 
  } = useTenant();
  
  const [accessGranted, setAccessGranted] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      // Wait for initial loading to complete
      if (sessionLoading || (requireTenant && tenantLoading)) {
        return;
      }

      let hasAccess = true;
      let redirectUrl = fallbackUrl;

      // Check authentication requirement
      if (requireAuth && !isAuthenticated) {
        hasAccess = false;
        redirectUrl = '/login';
      }

      // Check admin requirement
      if (hasAccess && requireAdmin && !isAdmin) {
        hasAccess = false;
        redirectUrl = '/login?error=unauthorized';
      }

      // Check super admin requirement
      if (hasAccess && requireSuperAdmin && !isSuperAdmin) {
        hasAccess = false;
        redirectUrl = '/login?error=unauthorized';
      }

      // Check tenant requirement
      if (hasAccess && requireTenant && (!tenant || !tenantUser)) {
        hasAccess = false;
        redirectUrl = '/login?error=no_tenant_access';
      }

      // Check specific permissions
      if (hasAccess && requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission => 
          hasPermission(permission)
        );
        
        if (!hasAllPermissions) {
          hasAccess = false;
          redirectUrl = '/login?error=insufficient_permissions';
        }
      }

      // Check required features
      if (hasAccess && requiredFeatures.length > 0) {
        const hasAllFeatures = requiredFeatures.every(feature => 
          hasFeature(feature)
        );
        
        if (!hasAllFeatures) {
          hasAccess = false;
          redirectUrl = '/login?error=feature_not_available';
        }
      }

      if (!hasAccess) {
        router.push(redirectUrl);
        return;
      }

      setAccessGranted(true);
      setChecking(false);
    };

    checkAccess();
  }, [
    sessionLoading,
    tenantLoading,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    tenant,
    tenantUser,
    requireAuth,
    requireAdmin,
    requireSuperAdmin,
    requireTenant,
    requiredPermissions,
    requiredFeatures,
    hasPermission,
    hasFeature,
    router,
    fallbackUrl
  ]);

  // Show loading state
  if (checking || sessionLoading || (requireTenant && tenantLoading)) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Render children if access is granted
  if (accessGranted) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}

// Convenience components for common use cases
export function RequireAuth({ children, ...props }: Omit<AuthGuardProps, 'requireAuth'>) {
  return (
    <AuthGuard requireAuth={true} {...props}>
      {children}
    </AuthGuard>
  );
}

export function RequireAdmin({ children, ...props }: Omit<AuthGuardProps, 'requireAdmin'>) {
  return (
    <AuthGuard requireAuth={true} requireAdmin={true} {...props}>
      {children}
    </AuthGuard>
  );
}

export function RequireSuperAdmin({ children, ...props }: Omit<AuthGuardProps, 'requireSuperAdmin'>) {
  return (
    <AuthGuard requireAuth={true} requireSuperAdmin={true} {...props}>
      {children}
    </AuthGuard>
  );
}

export function RequireTenant({ children, ...props }: Omit<AuthGuardProps, 'requireTenant'>) {
  return (
    <AuthGuard requireAuth={true} requireTenant={true} {...props}>
      {children}
    </AuthGuard>
  );
}

// Higher-order component for page-level protection
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps: Omit<AuthGuardProps, 'children'>
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard {...guardProps}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}