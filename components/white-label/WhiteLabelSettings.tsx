/**
 * White-Label Settings Component
 * 
 * Main component for managing enterprise white-label features including
 * custom branding, domain configuration, and feature toggles.
 * 
 * Requirements: 9.5 - Enterprise white-label features
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Globe, 
  Key, 
  Palette, 
  CheckCircle,
  AlertCircle,
  Copy,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { WhiteLabelConfig, ApiAccessConfig, EnterpriseFeature } from '@/lib/services/white-label';

interface WhiteLabelSettingsProps {
  tenantId: string;
  className?: string;
}

export default function WhiteLabelSettings({ tenantId, className }: WhiteLabelSettingsProps) {
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null);
  const [apiConfig, setApiConfig] = useState<ApiAccessConfig | null>(null);
  const [features, setFeatures] = useState<EnterpriseFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showApiSecret, setShowApiSecret] = useState(false);

  // Form states
  const [customDomain, setCustomDomain] = useState('');
  const [customCSS, setCustomCSS] = useState('');
  const [customJS, setCustomJS] = useState('');
  const [hideBranding, setHideBranding] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState('');
  const [loginLogoUrl, setLoginLogoUrl] = useState('');
  const [emailLogoUrl, setEmailLogoUrl] = useState('');

  useEffect(() => {
    loadWhiteLabelData();
  }, [tenantId]);

  const loadWhiteLabelData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load white-label configuration
      const configResponse = await fetch(`/api/white-label/config?tenant_id=${tenantId}`);
      if (configResponse.ok) {
        const { config } = await configResponse.json();
        setConfig(config);
        setCustomDomain(config.custom_domain || '');
        setCustomCSS(config.custom_css || '');
        setCustomJS(config.custom_js || '');
        setHideBranding(config.hide_branding || false);
        setFaviconUrl(config.favicon_url || '');
        setLoginLogoUrl(config.login_logo_url || '');
        setEmailLogoUrl(config.email_logo_url || '');
      }

      // Load API access configuration
      const apiResponse = await fetch(`/api/white-label/api-access?tenant_id=${tenantId}`);
      if (apiResponse.ok) {
        const { config: apiConfig } = await apiResponse.json();
        setApiConfig(apiConfig);
      }

      // Load enterprise features
      const featuresResponse = await fetch(`/api/white-label/features?tenant_id=${tenantId}`);
      if (featuresResponse.ok) {
        const { features } = await featuresResponse.json();
        setFeatures(features);
      }
    } catch (error) {
      console.error('Error loading white-label data:', error);
      setError('Failed to load white-label configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      setError(null);

      const updateData = {
        custom_domain: customDomain || undefined,
        custom_css: customCSS,
        custom_js: customJS,
        hide_branding: hideBranding,
        favicon_url: faviconUrl || undefined,
        login_logo_url: loginLogoUrl || undefined,
        email_logo_url: emailLogoUrl || undefined
      };

      const response = await fetch(`/api/white-label/config?tenant_id=${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      const { config: updatedConfig } = await response.json();
      setConfig(updatedConfig);
      setSuccess('Configuration saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error saving configuration:', error);
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const verifyDomain = async () => {
    if (!customDomain) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/white-label/domain/verify?tenant_id=${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: customDomain })
      });

      if (!response.ok) {
        throw new Error('Failed to verify domain');
      }

      await response.json();
      setSuccess('Domain verification initiated. Please configure the DNS records as shown.');
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      console.error('Error verifying domain:', error);
      setError('Failed to verify domain');
    } finally {
      setSaving(false);
    }
  };

  const regenerateApiCredentials = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/white-label/api-access/regenerate?tenant_id=${tenantId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate credentials');
      }

      await response.json();
      setSuccess('API credentials regenerated successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      // Reload API configuration
      await loadWhiteLabelData();
    } catch (error) {
      console.error('Error regenerating credentials:', error);
      setError('Failed to regenerate API credentials');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = async (featureKey: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/white-label/features/toggle?tenant_id=${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_key: featureKey, enabled })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle feature');
      }

      // Update local state
      setFeatures(prev => prev.map(feature => 
        feature.feature_key === featureKey 
          ? { ...feature, is_enabled: enabled }
          : feature
      ));

      setSuccess(`Feature ${enabled ? 'enabled' : 'disabled'} successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error toggling feature:', error);
      setError('Failed to toggle feature');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
    setTimeout(() => setSuccess(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading white-label settings...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">White-Label Settings</h2>
          <p className="text-muted-foreground">
            Configure advanced customization and enterprise features for your platform.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="branding" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="domain" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Domain
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Access
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Features
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Custom Branding</CardTitle>
                <CardDescription>
                  Customize the appearance and branding of your platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="favicon">Favicon URL</Label>
                    <Input
                      id="favicon"
                      placeholder="https://example.com/favicon.ico"
                      value={faviconUrl}
                      onChange={(e) => setFaviconUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-logo">Login Logo URL</Label>
                    <Input
                      id="login-logo"
                      placeholder="https://example.com/logo.png"
                      value={loginLogoUrl}
                      onChange={(e) => setLoginLogoUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-logo">Email Logo URL</Label>
                    <Input
                      id="email-logo"
                      placeholder="https://example.com/email-logo.png"
                      value={emailLogoUrl}
                      onChange={(e) => setEmailLogoUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="hide-branding"
                    checked={hideBranding}
                    onCheckedChange={setHideBranding}
                  />
                  <Label htmlFor="hide-branding">Hide platform branding</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-css">Custom CSS</Label>
                  <Textarea
                    id="custom-css"
                    placeholder="/* Add your custom CSS here */"
                    value={customCSS}
                    onChange={(e) => setCustomCSS(e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-js">Custom JavaScript</Label>
                  <Textarea
                    id="custom-js"
                    placeholder="// Add your custom JavaScript here"
                    value={customJS}
                    onChange={(e) => setCustomJS(e.target.value)}
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domain" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Custom Domain</CardTitle>
                <CardDescription>
                  Configure a custom domain for your white-label platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-domain">Custom Domain</Label>
                  <div className="flex gap-2">
                    <Input
                      id="custom-domain"
                      placeholder="app.yourcompany.com"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                    />
                    <Button onClick={verifyDomain} disabled={!customDomain || saving}>
                      {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Verify'}
                    </Button>
                  </div>
                </div>

                {config?.custom_domain && (
                  <div className="space-y-2">
                    <Label>Domain Status</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant={config.custom_domain_verified ? 'default' : 'secondary'}>
                        {config.custom_domain_verified ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pending
                          </>
                        )}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {config.custom_domain}
                      </span>
                    </div>
                  </div>
                )}

                {!config?.custom_domain_verified && customDomain && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      To verify your domain, add the following DNS records:
                      <div className="mt-2 space-y-1 font-mono text-xs">
                        <div>CNAME: {customDomain} → {tenantId}.solarcrm.clubemkt.digital</div>
                        <div>TXT: _solarcrm-verification.{customDomain} → [verification token]</div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Access</CardTitle>
                <CardDescription>
                  Manage API credentials and access configuration.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {apiConfig && (
                  <>
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <div className="flex gap-2">
                        <Input value={apiConfig.api_key} readOnly />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(apiConfig.api_key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>API Secret</Label>
                      <div className="flex gap-2">
                        <Input
                          type={showApiSecret ? 'text' : 'password'}
                          value={showApiSecret ? apiConfig.api_secret : '***hidden***'}
                          readOnly
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowApiSecret(!showApiSecret)}
                        >
                          {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        {showApiSecret && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(apiConfig.api_secret)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Rate Limit (per hour)</Label>
                        <Input value={apiConfig.rate_limit_per_hour.toLocaleString()} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Rate Limit (per day)</Label>
                        <Input value={apiConfig.rate_limit_per_day.toLocaleString()} readOnly />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>API Status</Label>
                        <p className="text-sm text-muted-foreground">
                          {apiConfig.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <Badge variant={apiConfig.is_active ? 'default' : 'secondary'}>
                        {apiConfig.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <Separator />

                    <Button
                      variant="outline"
                      onClick={regenerateApiCredentials}
                      disabled={saving}
                    >
                      {saving ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Regenerate Credentials
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enterprise Features</CardTitle>
                <CardDescription>
                  Enable or disable enterprise features for your platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {features.map((feature) => (
                    <div key={feature.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>{feature.feature_name}</Label>
                        <p className="text-sm text-muted-foreground">
                          {feature.feature_key}
                        </p>
                      </div>
                      <Switch
                        checked={feature.is_enabled}
                        onCheckedChange={(enabled) => toggleFeature(feature.feature_key, enabled)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={saveConfiguration} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Settings className="h-4 w-4 mr-2" />
            )}
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}