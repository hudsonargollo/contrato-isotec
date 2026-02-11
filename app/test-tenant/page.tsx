/**
 * Tenant System Test Page
 * 
 * Test page to verify the tenant management system is working correctly.
 * Shows tenant information, user role, permissions, and branding.
 * 
 * Requirements: 1.1, 1.2, 1.5 - Multi-Tenant Architecture
 */

'use client';

import { useState, useEffect } from 'react';
import { TenantProviderWrapper } from '@/components/tenant/TenantProvider';
import { TenantSwitcher } from '@/components/tenant/TenantSwitcher';
import { useTenant, useTenantBranding, useRole, usePermission } from '@/lib/contexts/tenant-context';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Users, Settings, Shield, Palette, Info } from 'lucide-react';

function TenantTestContent() {
  const { 
    tenant, 
    tenantUser, 
    context, 
    loading, 
    error, 
    hasPermission, 
    hasFeature,
    refreshTenant 
  } = useTenant();
  
  const { 
    branding, 
    primaryColor, 
    secondaryColor, 
    logoUrl, 
    isWhiteLabel 
  } = useTenantBranding();
  
  const { 
    role, 
    isOwner, 
    isAdmin, 
    canManageUsers 
  } = useRole();

  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  // Test various permissions
  const canViewUsers = usePermission('users.view');
  const canCreateLeads = usePermission('leads.create');
  const canManageSettings = usePermission('settings.update');

  useEffect(() => {
    // Run permission tests
    const results = {
      'users.view': hasPermission('users.view'),
      'users.create': hasPermission('users.create'),
      'leads.view': hasPermission('leads.view'),
      'leads.create': hasPermission('leads.create'),
      'contracts.view': hasPermission('contracts.view'),
      'settings.view': hasPermission('settings.view'),
      'settings.update': hasPermission('settings.update'),
    };
    setTestResults(results);
  }, [hasPermission]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tenant information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refreshTenant} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tenant || !tenantUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Tenant Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              You don't have access to any tenant or are not logged in.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tenant System Test
            </h1>
            <p className="text-gray-600 mt-1">
              Testing multi-tenant architecture implementation
            </p>
          </div>
          <TenantSwitcher />
        </div>

        {/* Tenant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Tenant Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-lg font-semibold">{tenant.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Domain</label>
                <p className="text-lg">{tenant.domain}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Subdomain</label>
                <p className="text-lg">{tenant.subdomain}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                  {tenant.status}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Plan</label>
                <Badge variant="outline">
                  {tenant.subscription.plan}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Features</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {tenant.subscription.features.map(feature => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Role & Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>User Role & Permissions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Role</label>
                <Badge className="mt-1 capitalize">{role}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Is Owner</label>
                <Badge variant={isOwner ? 'default' : 'secondary'}>
                  {isOwner ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Is Admin</label>
                <Badge variant={isAdmin ? 'default' : 'secondary'}>
                  {isAdmin ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Can Manage Users</label>
                <Badge variant={canManageUsers ? 'default' : 'secondary'}>
                  {canManageUsers ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 mb-2 block">
                Permission Tests
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(testResults).map(([permission, hasAccess]) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Badge 
                      variant={hasAccess ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {permission}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Tenant Branding</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Primary Color</label>
                <div className="flex items-center space-x-2 mt-1">
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: primaryColor }}
                  ></div>
                  <span className="text-sm font-mono">{primaryColor}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Secondary Color</label>
                <div className="flex items-center space-x-2 mt-1">
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: secondaryColor }}
                  ></div>
                  <span className="text-sm font-mono">{secondaryColor}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">White Label</label>
                <Badge variant={isWhiteLabel ? 'default' : 'secondary'}>
                  {isWhiteLabel ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
            {logoUrl && (
              <div>
                <label className="text-sm font-medium text-gray-500">Logo</label>
                <img 
                  src={logoUrl} 
                  alt="Tenant Logo" 
                  className="mt-2 h-12 object-contain"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5" />
              <span>Subscription Limits</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(tenant.subscription.limits).map(([key, value]) => (
                <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{value}</p>
                  <p className="text-sm text-gray-600 capitalize">
                    {key.replace('_', ' ')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feature Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {['crm', 'screening', 'invoices', 'whatsapp', 'analytics', 'contracts', 'api'].map(feature => (
                <div key={feature} className="flex items-center space-x-2">
                  <Badge 
                    variant={hasFeature(feature) ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {feature}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Raw Context Data */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Context Data</CardTitle>
            <CardDescription>
              Debug information showing the complete tenant context
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto">
              {JSON.stringify({ tenant, tenantUser, context }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TenantTestPage() {
  return (
    <TenantProviderWrapper>
      <TenantTestContent />
    </TenantProviderWrapper>
  );
}