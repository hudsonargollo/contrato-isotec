/**
 * API Key Management Component
 * 
 * React component for managing API keys including creation, listing,
 * updating, rotation, and usage analytics visualization.
 * 
 * Requirements: 10.4 - API rate limiting and usage tracking
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Key, 
  Plus, 
  RotateCcw, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { API_SCOPES, APIScope } from '@/lib/services/api-key-management';

interface APIKey {
  id: string;
  name: string;
  description?: string;
  key_prefix: string;
  scopes: string[];
  active: boolean;
  last_used_at?: string;
  total_requests: number;
  created_at: string;
  expires_at?: string;
}

interface APIKeyWithSecret extends APIKey {
  key: string;
}

interface CreateAPIKeyData {
  name: string;
  description: string;
  scopes: string[];
  expires_at?: string;
  rate_limit_override?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
    burstLimit?: number;
  };
}

interface ApiKeyManagementProps {
  tenantId: string;
  className?: string;
}

export default function ApiKeyManagement({ tenantId, className }: ApiKeyManagementProps) {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState<APIKeyWithSecret | null>(null);
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);

  // Form state
  const [createForm, setCreateForm] = useState<CreateAPIKeyData>({
    name: '',
    description: '',
    scopes: []
  });

  useEffect(() => {
    loadApiKeys();
  }, [tenantId]);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/api-keys?tenant_id=${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load API keys');
      }

      const data = await response.json();
      setApiKeys(data.api_keys || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    try {
      setError(null);

      if (!createForm.name.trim()) {
        setError('API key name is required');
        return;
      }

      if (createForm.scopes.length === 0) {
        setError('At least one scope is required');
        return;
      }

      const response = await fetch(`/api/admin/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          ...createForm,
          expires_at: createForm.expires_at || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create API key');
      }

      const data = await response.json();
      setNewApiKey(data.api_key);
      setShowKeyDialog(true);
      setShowCreateDialog(false);
      
      // Reset form
      setCreateForm({
        name: '',
        description: '',
        scopes: []
      });

      // Reload keys
      await loadApiKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
      setError(error instanceof Error ? error.message : 'Failed to create API key');
    }
  };

  const rotateApiKey = async (keyId: string) => {
    try {
      setError(null);

      const response = await fetch(`/api/admin/api-keys/${keyId}/rotate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to rotate API key');
      }

      const data = await response.json();
      setNewApiKey(data.api_key);
      setShowKeyDialog(true);
      
      await loadApiKeys();
    } catch (error) {
      console.error('Error rotating API key:', error);
      setError('Failed to rotate API key');
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);

      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete API key');
      }

      await loadApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      setError('Failed to delete API key');
    }
  };

  const toggleApiKey = async (keyId: string, active: boolean) => {
    try {
      setError(null);

      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ active })
      });

      if (!response.ok) {
        throw new Error('Failed to update API key');
      }

      await loadApiKeys();
    } catch (error) {
      console.error('Error updating API key:', error);
      setError('Failed to update API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScopeDescription = (scope: string): string => {
    return API_SCOPES[scope as APIScope] || scope;
  };

  const isExpired = (expiresAt?: string): boolean => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading API keys...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">API Key Management</h2>
            <p className="text-muted-foreground">
              Create and manage API keys for programmatic access to your data.
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
                <DialogDescription>
                  Create a new API key with specific scopes and permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g., Production API Key"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Describe what this API key will be used for..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Scopes</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {Object.entries(API_SCOPES).map(([scope, description]) => (
                      <div key={scope} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={scope}
                          checked={createForm.scopes.includes(scope)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm({
                                ...createForm,
                                scopes: [...createForm.scopes, scope]
                              });
                            } else {
                              setCreateForm({
                                ...createForm,
                                scopes: createForm.scopes.filter(s => s !== scope)
                              });
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={scope} className="text-sm">
                          <code className="text-xs">{scope}</code>
                          <div className="text-xs text-muted-foreground">{description}</div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires_at">Expiration Date (Optional)</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={createForm.expires_at || ''}
                    onChange={(e) => setCreateForm({ ...createForm, expires_at: e.target.value })}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createApiKey}>
                    Create API Key
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* API Keys List */}
        <div className="space-y-4">
          {apiKeys.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No API Keys</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first API key to start using the API.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </CardContent>
            </Card>
          ) : (
            apiKeys.map((apiKey) => (
              <Card key={apiKey.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {apiKey.name}
                        {!apiKey.active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {isExpired(apiKey.expires_at) && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {apiKey.description || 'No description provided'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={apiKey.active}
                        onCheckedChange={(checked) => toggleApiKey(apiKey.id, checked)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rotateApiKey(apiKey.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteApiKey(apiKey.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">API Key</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {apiKey.key_prefix}••••••••••••••••
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(apiKey.key_prefix)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Total Requests</div>
                        <div className="text-lg font-medium">{apiKey.total_requests.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Created</Label>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(apiKey.created_at)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Last Used</Label>
                        <div className="text-sm text-muted-foreground">
                          {apiKey.last_used_at ? formatDate(apiKey.last_used_at) : 'Never'}
                        </div>
                      </div>
                    </div>

                    {apiKey.expires_at && (
                      <div>
                        <Label className="text-sm font-medium">Expires</Label>
                        <div className={`text-sm ${isExpired(apiKey.expires_at) ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {formatDate(apiKey.expires_at)}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium">Scopes</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {apiKey.scopes.map((scope) => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* New API Key Dialog */}
        <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Key Created</DialogTitle>
              <DialogDescription>
                Your API key has been created. Copy it now as it won't be shown again.
              </DialogDescription>
            </DialogHeader>
            {newApiKey && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    API key created successfully! Make sure to copy it now.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={newApiKey.key}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(newApiKey.key)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Usage Example</h4>
                  <code className="text-sm">
                    curl -H "X-API-Key: {newApiKey.key}" https://your-domain.com/api/leads
                  </code>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}