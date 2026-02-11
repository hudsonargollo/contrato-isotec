/**
 * Webhook Endpoints Management Component
 * 
 * Allows tenants to configure webhook endpoints for receiving
 * real-time notifications about system events.
 * 
 * Requirements: 10.2 - Webhook system and third-party integrations
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
import { Trash2, Plus, Settings, Activity, AlertCircle, CheckCircle } from 'lucide-react';

// Simple toast replacement
const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.error('Error:', message)
};

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  name?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface WebhookDelivery {
  id: string;
  event_type: string;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  response_status?: number;
  error_message?: string;
  created_at: string;
  delivered_at?: string;
}

interface WebhookStats {
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  pending_deliveries: number;
  success_rate: number;
}

const AVAILABLE_EVENTS = [
  { value: 'lead.created', label: 'Lead Created' },
  { value: 'lead.updated', label: 'Lead Updated' },
  { value: 'lead.status_changed', label: 'Lead Status Changed' },
  { value: 'contract.generated', label: 'Contract Generated' },
  { value: 'contract.signed', label: 'Contract Signed' },
  { value: 'contract.expired', label: 'Contract Expired' },
  { value: 'invoice.created', label: 'Invoice Created' },
  { value: 'invoice.paid', label: 'Invoice Paid' },
  { value: 'invoice.overdue', label: 'Invoice Overdue' },
  { value: 'payment.succeeded', label: 'Payment Succeeded' },
  { value: 'payment.failed', label: 'Payment Failed' },
  { value: 'screening.completed', label: 'Screening Completed' },
  { value: 'whatsapp.message_sent', label: 'WhatsApp Message Sent' },
  { value: 'whatsapp.message_received', label: 'WhatsApp Message Received' },
  { value: 'user.created', label: 'User Created' },
  { value: 'user.updated', label: 'User Updated' },
  { value: 'tenant.updated', label: 'Tenant Updated' }
];

interface WebhookEndpointsProps {
  tenantId: string;
}

export default function WebhookEndpoints({ tenantId }: WebhookEndpointsProps) {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    url: '',
    events: [] as string[],
    name: '',
    description: ''
  });

  useEffect(() => {
    loadEndpoints();
    loadDeliveries();
  }, [tenantId]);

  const loadEndpoints = async () => {
    try {
      const response = await fetch(`/api/webhooks/endpoints?tenant_id=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setEndpoints(data.endpoints);
      }
    } catch (error) {
      console.error('Failed to load webhook endpoints:', error);
      toast.error('Failed to load webhook endpoints');
    }
  };

  const loadDeliveries = async () => {
    try {
      const response = await fetch(`/api/webhooks/deliveries?tenant_id=${tenantId}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data.deliveries);
        setStats(data.statistics);
      }
    } catch (error) {
      console.error('Failed to load webhook deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEndpoint = async () => {
    if (!formData.url || formData.events.length === 0) {
      toast.error('URL and at least one event are required');
      return;
    }

    try {
      const response = await fetch(`/api/webhooks/endpoints?tenant_id=${tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Webhook endpoint created successfully');
        setShowCreateForm(false);
        setFormData({ url: '', events: [], name: '', description: '' });
        loadEndpoints();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      console.error('Failed to create webhook endpoint:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create webhook endpoint');
    }
  };

  const toggleEndpoint = async (endpointId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/webhooks/endpoints?id=${endpointId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active })
      });

      if (response.ok) {
        toast.success(`Webhook endpoint ${active ? 'enabled' : 'disabled'}`);
        loadEndpoints();
      } else {
        throw new Error('Failed to update endpoint');
      }
    } catch (error) {
      console.error('Failed to toggle webhook endpoint:', error);
      toast.error('Failed to update webhook endpoint');
    }
  };

  const deleteEndpoint = async (endpointId: string) => {
    if (!confirm('Are you sure you want to delete this webhook endpoint?')) {
      return;
    }

    try {
      const response = await fetch(`/api/webhooks/endpoints?id=${endpointId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Webhook endpoint deleted successfully');
        loadEndpoints();
      } else {
        throw new Error('Failed to delete endpoint');
      }
    } catch (error) {
      console.error('Failed to delete webhook endpoint:', error);
      toast.error('Failed to delete webhook endpoint');
    }
  };

  const retryFailedDeliveries = async () => {
    try {
      const response = await fetch(`/api/webhooks/deliveries/retry?tenant_id=${tenantId}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Retried ${data.retried_count} failed deliveries`);
        loadDeliveries();
      } else {
        throw new Error('Failed to retry deliveries');
      }
    } catch (error) {
      console.error('Failed to retry deliveries:', error);
      toast.error('Failed to retry failed deliveries');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'retrying':
        return <Activity className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading webhook configuration...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total_deliveries}</div>
              <div className="text-sm text-muted-foreground">Total Deliveries</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.successful_deliveries}</div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.failed_deliveries}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.success_rate}%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Webhook Endpoints */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Webhook Endpoints</CardTitle>
              <CardDescription>
                Configure URLs to receive real-time notifications about system events
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Endpoint
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {endpoints.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No webhook endpoints configured
            </div>
          ) : (
            <div className="space-y-4">
              {endpoints.map((endpoint) => (
                <div key={endpoint.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{endpoint.name || 'Unnamed Endpoint'}</h3>
                        <Badge variant={endpoint.active ? 'default' : 'secondary'}>
                          {endpoint.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{endpoint.url}</p>
                      {endpoint.description && (
                        <p className="text-sm text-muted-foreground mb-2">{endpoint.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {endpoint.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {AVAILABLE_EVENTS.find(e => e.value === event)?.label || event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={endpoint.active}
                        onCheckedChange={(checked) => toggleEndpoint(endpoint.id, checked)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEndpoint(endpoint.id)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteEndpoint(endpoint.id)}
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

      {/* Recent Deliveries */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Deliveries</CardTitle>
              <CardDescription>
                Recent webhook delivery attempts and their status
              </CardDescription>
            </div>
            {stats && stats.failed_deliveries > 0 && (
              <Button variant="outline" onClick={retryFailedDeliveries}>
                Retry Failed
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent deliveries
            </div>
          ) : (
            <div className="space-y-2">
              {deliveries.map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(delivery.status)}
                    <div>
                      <div className="font-medium">{delivery.event_type}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(delivery.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      delivery.status === 'delivered' ? 'default' :
                      delivery.status === 'failed' ? 'destructive' :
                      delivery.status === 'retrying' ? 'secondary' : 'outline'
                    }>
                      {delivery.status}
                    </Badge>
                    {delivery.response_status && (
                      <div className="text-sm text-muted-foreground mt-1">
                        HTTP {delivery.response_status}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Endpoint Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Webhook Endpoint</CardTitle>
            <CardDescription>
              Add a new webhook endpoint to receive event notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Webhook Endpoint"
              />
            </div>
            <div>
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://your-app.com/webhooks/solarcrm"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description of what this webhook is used for"
              />
            </div>
            <div>
              <Label>Events to Subscribe *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {AVAILABLE_EVENTS.map((event) => (
                  <label key={event.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.events.includes(event.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            events: [...formData.events, event.value]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            events: formData.events.filter(ev => ev !== event.value)
                          });
                        }
                      }}
                    />
                    <span className="text-sm">{event.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createEndpoint}>Create Endpoint</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}