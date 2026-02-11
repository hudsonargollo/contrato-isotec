/**
 * White-Label Settings Admin Page
 * 
 * Admin page for managing enterprise white-label features including
 * custom branding, domain configuration, API access, and feature toggles.
 * 
 * Requirements: 9.5 - Enterprise white-label features
 */

'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WhiteLabelSettings from '@/components/white-label/WhiteLabelSettings';
import ApiUsageDashboard from '@/components/white-label/ApiUsageDashboard';
import { Settings, BarChart3 } from 'lucide-react';

export default function WhiteLabelAdminPage() {
  // In a real implementation, this would come from the tenant context
  const tenantId = 'demo-tenant-id';

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Enterprise White-Label</h1>
        <p className="text-muted-foreground">
          Advanced customization and enterprise features for your SolarCRM Pro platform.
        </p>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            API Usage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <WhiteLabelSettings tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="usage">
          <ApiUsageDashboard tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}