/**
 * Tenant Switcher Component
 * 
 * Component that allows users to switch between different tenants
 * they have access to. Shows current tenant and provides switching functionality.
 * 
 * Requirements: 1.1, 1.2 - Multi-Tenant Architecture
 */

'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/lib/contexts/tenant-context';
import { TenantUser } from '@/lib/types/tenant';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Building2, Check } from 'lucide-react';

export function TenantSwitcher() {
  const { tenant, tenantUser, switchTenant, loading } = useTenant();
  const [availableTenants, setAvailableTenants] = useState<TenantUser[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  
  const supabase = createClient();

  // Load available tenants for the current user
  useEffect(() => {
    async function loadTenants() {
      if (!tenantUser) return;
      
      setLoadingTenants(true);
      try {
        const { data: tenantUsers, error } = await supabase
          .from('tenant_users')
          .select(`
            *,
            tenant:tenants(*)
          `)
          .eq('user_id', tenantUser.user_id)
          .eq('status', 'active')
          .order('role', { ascending: true })
          .order('joined_at', { ascending: true });

        if (error) {
          console.error('Error loading tenants:', error);
          return;
        }

        setAvailableTenants(tenantUsers || []);
      } catch (error) {
        console.error('Error loading tenants:', error);
      } finally {
        setLoadingTenants(false);
      }
    }

    loadTenants();
  }, [tenantUser, supabase]);

  const handleTenantSwitch = async (tenantId: string) => {
    if (tenantId === tenant?.id) return;
    
    try {
      await switchTenant(tenantId);
      // Optionally reload the page to ensure all components get the new context
      window.location.reload();
    } catch (error) {
      console.error('Error switching tenant:', error);
    }
  };

  if (loading || !tenant || !tenantUser) {
    return (
      <div className="flex items-center space-x-2">
        <Building2 className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  // If user only has access to one tenant, show it without dropdown
  if (availableTenants.length <= 1) {
    return (
      <div className="flex items-center space-x-2">
        <Building2 className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-900">
          {tenant.name}
        </span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Building2 className="h-4 w-4" />
          <span className="text-sm font-medium">{tenant.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loadingTenants ? (
          <DropdownMenuItem disabled>
            Loading tenants...
          </DropdownMenuItem>
        ) : (
          availableTenants.map((tu) => {
            const tenantData = tu.tenant;
            const isCurrentTenant = tenantData.id === tenant.id;
            
            return (
              <DropdownMenuItem
                key={tu.id}
                onClick={() => handleTenantSwitch(tenantData.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{tenantData.name}</span>
                  <span className="text-xs text-gray-500 capitalize">
                    {tu.role}
                  </span>
                </div>
                {isCurrentTenant && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}