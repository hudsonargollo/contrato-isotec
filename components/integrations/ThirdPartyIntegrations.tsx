/**
 * Third-Party Integrations Management Component
 * 
 * Allows tenants to configure and manage external service integrations
 * for CRM systems, email services, analytics platforms, and more.
 * 
 * Requirements: 10.2 - Third-party integrations and real-time data synchronization
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  TestTube, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock
} from 'lucide-react';
// Simple toast replacement
const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.error('Error:', message)
};

interface ThirdPartyIntegration {
  id: string;
  service_name: string;
  service_type: 'crm' | 'email' | 'sms' | 'analytics' | 'storage' | 'payment' | 'other';
  configuration: Record<string, any>;
  credentials: Record<string, string>;
  active: boolean;
  sync_enabled: boolean;
  last_sync_at?: string;
  sync_frequency_minutes?: number;
  last_error?: string;
  error_count: number;
  last_error_at?: string;
  created_at: string;
  updated_at: string;
}

interface SyncOperation {
  id: string;
  operation_type: 'create' | 'update' | 'delete' | 'sync';
  direction: 'inbound' | 'outbound' | 'bidirectional';
  entity_type: string;
  entity_id?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

interface IntegrationTemplate {
  service_name: string;
  service_type: string;
  configuration: Record<string, any>;
  required_credentials: string[];
}

interface ThirdPartyIntegrationsProps {
  tenantId: string;
}

const SERVICE_TYPE_LABELS = {
  crm: 'CRM',
  email: 'Email',
  sms: 'SMS',
  analytics: 'Analytics',
  storage: 'Storage',
  payment: 'Payment',
  other: 'Other'
};

export default function ThirdPartyIntegrations({ tenantId }: ThirdPartyIntegrationsProps) {
  const [integrations, setIntegrations] = useState<ThirdPartyIntegration[]>([]);
  const [templates, setTemplates] = useState<Record<string, IntegrationTemplate>>({});
  const [syncHistory, setSyncHistory] = useState<SyncOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    service_name: '',
    service_type: 'other' as const,
    configuration: {} as Record<string, any>,
    credentials: {} as Record<string, any>,
    sync_enabled: false,
    sync_frequency_minutes: 60
  });

  useEffect(() => {
    loadIntegrations();
    loadSyncHistory();
  }, [tenantId]);

  const loadIntegrations = async () => {
    try {
      const response = await fetch(`/api/integrations?tenant_id=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations);
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to load integrations:', error);
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const loadSyncHistory = async () => {
    try {
      const response = await fetch(`/api/integrations/sync/history?tenant_id=${tenantId}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setSyncHistory(data.sync_operations);
      }
    } catch (error) {
      console.error('Failed to load sync history:', error);
    }
  };

  const createIntegration = async () => {
    if (!formData.service_name) {
      toast.error('Service name is required');
      return;
    }

    try {
      const response = await fetch(`/api/integrations?tenant_id=${tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Integration created successfully');
        setShowCreateForm(false);
        resetForm();
        loadIntegrations();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      console.error('Failed to create integration:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create integration');
    }
  };

  const testConnection = async (integrationId: string) => {
    setTestingConnection(integrationId);
    try {
      const response = await fetch(`/api/integrations/test?integration_id=${integrationId}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Integration is working correctly');
        } else {
          toast.error(data.error || 'Connection test failed');
        }
      } else {
        throw new Error('Failed to test connection');
      }
    } catch (error) {
      console.error('Failed to test connection:', error);
      toast.error('Failed to test connection');
    } finally {
      setTestingConnection(null);
    }
  };

  const toggleIntegration = async (integrationId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/integrations?id=${integrationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active })
      });

      if (response.ok) {
        toast.success(`Integration ${active ? 'enabled' : 'disabled'}`);
        loadIntegrations();
      } else {
        throw new Error('Failed to update integration');
      }
    } catch (error) {
      console.error('Failed to toggle integration:', error);
      toast.error('Failed to update integration');
    }
  };

  const deleteIntegration = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/integrations?id=${integrationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Integration deleted successfully');
        loadIntegrations();
      } else {
        throw new Error('Failed to delete integration');
      }
    } catch (error) {
      console.error('Failed to delete integration:', error);
      toast.error('Failed to delete integration');
    }
  };

  const triggerSync = async (integrationId: string, entityType: string = 'all') => {
    try {
      const response = await fetch(`/api/integrations/sync?tenant_id=${tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          integration_id: integrationId,
          operation_type: 'sync',
          entity_type: entityType
        })
      });

      if (response.ok) {
        toast.success('Data synchronization has been initiated');
        loadSyncHistory();
      } else {
        throw new Error('Failed to trigger sync');
      }
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      toast.error('Failed to trigger sync');
    }
  };

  const resetForm = () => {
    setFormData({
      service_name: '',
      service_type: 'other',
      configuration: {},
      credentials: {},
      sync_enabled: false,
      sync_frequency_minutes: 60
    });
    setSelectedTemplate('');
  };

  const applyTemplate = (templateKey: string) => {
    const template = templates[templateKey];
    if (template) {
      setFormData({
        ...formData,
        service_name: template.service_name,
        service_type: template.service_type as any,
        configuration: { ...template.configuration }
      });
      setSelectedTemplate(templateKey);
    }
  };

  const getStatusIcon = (integration: ThirdPartyIntegration) => {
    if (!integration.active) {
      return <XCircle className="h-4 w-4 text-gray-400" />;
    }
    if (integration.error_count > 0) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading integrations...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="integrations" className="w-full">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="sync-history">Sync History</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          {/* Integrations List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Third-Party Integrations</CardTitle>
                  <CardDescription>
                    Connect external services to synchronize data and automate workflows
                  </CardDescription>
                </div>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Integration
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {integrations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No integrations configured
                </div>
              ) : (
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(integration)}
                            <h3 className="font-medium">{integration.service_name}</h3>
                            <Badge variant="outline">
                              {SERVICE_TYPE_LABELS[integration.service_type]}
                            </Badge>
                            <Badge variant={integration.active ? 'default' : 'secondary'}>
                              {integration.active ? 'Active' : 'Inactive'}
                            </Badge>
                            {integration.sync_enabled && (
                              <Badge variant="outline">Sync Enabled</Badge>
                            )}
                          </div>
                          {integration.last_sync_at && (
                            <p className="text-sm text-muted-foreground mb-1">
                              Last sync: {new Date(integration.last_sync_at).toLocaleString()}
                            </p>
                          )}
                          {integration.last_error && (
                            <p className="text-sm text-red-600 mb-1">
                              Error: {integration.last_error}
                            </p>
                          )}
                          {integration.error_count > 0 && (
                            <p className="text-sm text-muted-foreground">
                              {integration.error_count} error(s) since last success
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testConnection(integration.id)}
                            disabled={testingConnection === integration.id}
                          >
                            <TestTube className="h-4 w-4" />
                            {testingConnection === integration.id ? 'Testing...' : 'Test'}
                          </Button>
                          {integration.sync_enabled && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => triggerSync(integration.id)}
                            >
                              <RefreshCw className="h-4 w-4" />
                              Sync
                            </Button>
                          )}
                          <Switch
                            checked={integration.active}
                            onCheckedChange={(checked) => toggleIntegration(integration.id, checked)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteIntegration(integration.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Integration Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create Integration</CardTitle>
                <CardDescription>
                  Add a new third-party service integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template Selection */}
                <div>
                  <Label>Use Template (Optional)</Label>
                  <Select value={selectedTemplate} onValueChange={applyTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(templates).map(([key, template]) => (
                        <SelectItem key={key} value={key}>
                          {template.service_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="service_name">Service Name *</Label>
                  <Input
                    id="service_name"
                    value={formData.service_name}
                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                    placeholder="HubSpot CRM"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="service_type">Service Type *</Label>
                  <Select
                    value={formData.service_type}
                    onValueChange={(value: any) => setFormData({ ...formData, service_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Configuration</Label>
                  <Textarea
                    value={JSON.stringify(formData.configuration, null, 2)}
                    onChange={(e) => {
                      try {
                        const config = JSON.parse(e.target.value);
                        setFormData({ ...formData, configuration: config });
                      } catch (error) {
                        // Invalid JSON, ignore
                      }
                    }}
                    placeholder='{"api_base_url": "https://api.example.com"}'
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Credentials</Label>
                  <Textarea
                    value={JSON.stringify(formData.credentials, null, 2)}
                    onChange={(e) => {
                      try {
                        const credentials = JSON.parse(e.target.value);
                        setFormData({ ...formData, credentials });
                      } catch (error) {
                        // Invalid JSON, ignore
                      }
                    }}
                    placeholder='{"api_key": "your-api-key", "secret": "your-secret"}'
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="sync_enabled"
                    checked={formData.sync_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, sync_enabled: checked })}
                  />
                  <Label htmlFor="sync_enabled">Enable automatic synchronization</Label>
                </div>

                {formData.sync_enabled && (
                  <div>
                    <Label htmlFor="sync_frequency">Sync Frequency (minutes)</Label>
                    <Input
                      id="sync_frequency"
                      type="number"
                      min="1"
                      value={formData.sync_frequency_minutes}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        sync_frequency_minutes: parseInt(e.target.value) || 60 
                      })}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={createIntegration}>Create Integration</Button>
                  <Button variant="outline" onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sync-history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization History</CardTitle>
              <CardDescription>
                Recent data synchronization operations and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {syncHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sync operations found
                </div>
              ) : (
                <div className="space-y-2">
                  {syncHistory.map((sync) => (
                    <div key={sync.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {getSyncStatusIcon(sync.status)}
                        <div>
                          <div className="font-medium">
                            {sync.operation_type} {sync.entity_type}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(sync.started_at).toLocaleString()}
                          </div>
                          {sync.error_message && (
                            <div className="text-sm text-red-600">
                              {sync.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          sync.status === 'completed' ? 'default' :
                          sync.status === 'failed' ? 'destructive' :
                          sync.status === 'running' ? 'secondary' : 'outline'
                        }>
                          {sync.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          {sync.direction}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}