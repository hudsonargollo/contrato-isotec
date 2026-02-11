/**
 * Tenant Provider Component
 * 
 * Wrapper component that provides tenant context to the application.
 * This component should wrap the entire application to provide tenant-specific
 * functionality throughout the app.
 * 
 * Requirements: 1.1, 1.2, 1.5 - Multi-Tenant Architecture
 */

'use client';

import { TenantProvider } from '@/lib/contexts/tenant-context';
import { Tenant, TenantUser } from '@/lib/types/tenant';

interface TenantProviderWrapperProps {
  children: React.ReactNode;
  initialTenant?: Tenant;
  initialTenantUser?: TenantUser;
}

export function TenantProviderWrapper({ 
  children, 
  initialTenant, 
  initialTenantUser 
}: TenantProviderWrapperProps) {
  return (
    <TenantProvider 
      initialTenant={initialTenant} 
      initialTenantUser={initialTenantUser}
    >
      {children}
    </TenantProvider>
  );
}