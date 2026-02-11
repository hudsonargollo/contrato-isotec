/**
 * API Documentation Page
 * 
 * Interactive API documentation using Swagger UI for the SolarCRM Pro API.
 * Provides a comprehensive interface for testing and exploring API endpoints.
 * 
 * Requirements: 10.1, 10.3 - API-first architecture
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Book, 
  Code, 
  Key, 
  Shield, 
  Zap,
  ExternalLink,
  Download,
  Info
} from 'lucide-react';

export default function ApiDocsPage() {
  const swaggerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Swagger UI dynamically
    const loadSwaggerUI = async () => {
      if (typeof window !== 'undefined' && swaggerContainerRef.current) {
        // In a real implementation, you would load Swagger UI from CDN
        // For now, we'll create a placeholder
        const container = swaggerContainerRef.current;
        container.innerHTML = `
          <div class="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div class="text-center">
              <div class="text-4xl mb-4">📚</div>
              <h3 class="text-lg font-semibold mb-2">Interactive API Documentation</h3>
              <p class="text-gray-600 mb-4">Swagger UI would be loaded here in production</p>
              <a 
                href="/api/docs" 
                target="_blank"
                class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                View OpenAPI Spec
                <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </div>
          </div>
        `;
      }
    };

    loadSwaggerUI();
  }, []);

  const downloadSpec = async (format: 'json' | 'yaml') => {
    try {
      const response = await fetch(`/api/docs?format=${format}`);
      const content = await response.text();
      
      const blob = new Blob([content], { 
        type: format === 'json' ? 'application/json' : 'application/x-yaml' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `solarcrm-api.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading API spec:', error);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
          <p className="text-muted-foreground">
            Comprehensive REST API for SolarCRM Pro - Multi-tenant Solar Energy CRM Platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => downloadSpec('json')}>
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
          <Button variant="outline" onClick={() => downloadSpec('yaml')}>
            <Download className="h-4 w-4 mr-2" />
            YAML
          </Button>
          <Button asChild>
            <a href="/api/docs" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Raw Spec
            </a>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
          <TabsTrigger value="interactive">Interactive Docs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Version</CardTitle>
                <Code className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">v1.0.0</div>
                <p className="text-xs text-muted-foreground">
                  OpenAPI 3.0.3 specification
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Base URL</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-mono">
                  /api
                </div>
                <p className="text-xs text-muted-foreground">
                  All endpoints are relative to this base
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Content Type</CardTitle>
                <Book className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-mono">
                  application/json
                </div>
                <p className="text-xs text-muted-foreground">
                  All requests and responses
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Available Endpoints</CardTitle>
              <CardDescription>
                Core API endpoints organized by functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Tenants</Badge>
                    <span className="text-sm">Multi-tenant management</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-2">
                    • GET /tenants - List tenants<br/>
                    • POST /tenants - Create tenant<br/>
                    • GET /tenants/{'{id}'} - Get tenant details
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">CRM</Badge>
                    <span className="text-sm">Customer relationship management</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-2">
                    • GET /crm/leads - List leads<br/>
                    • POST /crm/leads - Create lead<br/>
                    • PUT /crm/leads/{'{id}'} - Update lead
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Contracts</Badge>
                    <span className="text-sm">Contract generation and management</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-2">
                    • GET /contracts - List contracts<br/>
                    • POST /contracts - Create contract<br/>
                    • GET /contracts/{'{id}'} - Get contract details
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Invoices</Badge>
                    <span className="text-sm">Invoice generation and payment</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-2">
                    • GET /invoices - List invoices<br/>
                    • POST /invoices - Create invoice<br/>
                    • POST /invoices/{'{id}'}/send - Send invoice
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Analytics</Badge>
                    <span className="text-sm">Analytics and reporting</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-2">
                    • GET /analytics/metrics - Get metrics<br/>
                    • GET /analytics/reports - Generate reports<br/>
                    • GET /analytics/dashboards - List dashboards
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">WhatsApp</Badge>
                    <span className="text-sm">WhatsApp Business integration</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-2">
                    • POST /whatsapp/messages - Send message<br/>
                    • GET /whatsapp/templates - List templates<br/>
                    • POST /whatsapp/campaigns - Create campaign
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              The SolarCRM Pro API supports two authentication methods: JWT Bearer tokens for user authentication and API keys for enterprise white-label access.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  JWT Bearer Authentication
                </CardTitle>
                <CardDescription>
                  Standard user authentication using Supabase JWT tokens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Header Format</h4>
                  <code className="block p-2 bg-gray-100 rounded text-sm">
                    Authorization: Bearer {'<jwt_token>'}
                  </code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Usage</h4>
                  <p className="text-sm text-muted-foreground">
                    Used for all user-facing operations. Token is obtained through Supabase authentication flow.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Permissions</h4>
                  <p className="text-sm text-muted-foreground">
                    Access is controlled by user roles and tenant membership. Each user can only access data within their tenant.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Key Authentication
                </CardTitle>
                <CardDescription>
                  Enterprise white-label API access for external integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Header Format</h4>
                  <code className="block p-2 bg-gray-100 rounded text-sm">
                    X-API-Key: sk_{'<api_key>'}
                  </code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Usage</h4>
                  <p className="text-sm text-muted-foreground">
                    Used for server-to-server integrations and enterprise white-label features. Available only for Enterprise plan tenants.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Rate Limits</h4>
                  <p className="text-sm text-muted-foreground">
                    Subject to subscription-tier based rate limiting. Enterprise plans have higher limits.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Error Responses</CardTitle>
              <CardDescription>
                Common authentication error responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">401 Unauthorized</h4>
                  <code className="block p-2 bg-gray-100 rounded text-sm">
                    {JSON.stringify({ error: "Authentication required" }, null, 2)}
                  </code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">403 Forbidden</h4>
                  <code className="block p-2 bg-gray-100 rounded text-sm">
                    {JSON.stringify({ error: "Insufficient permissions" }, null, 2)}
                  </code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">429 Too Many Requests</h4>
                  <code className="block p-2 bg-gray-100 rounded text-sm">
                    {JSON.stringify({ error: "Rate limit exceeded" }, null, 2)}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rate-limits" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Rate limits are enforced per tenant and vary based on subscription plan. Limits are calculated on both hourly and daily windows.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Starter Plan</CardTitle>
                <CardDescription>Basic rate limits for starter tenants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Hourly limit:</span>
                  <Badge variant="secondary">1,000</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Daily limit:</span>
                  <Badge variant="secondary">10,000</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Burst limit:</span>
                  <Badge variant="secondary">50/min</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Professional Plan</CardTitle>
                <CardDescription>Enhanced limits for professional use</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Hourly limit:</span>
                  <Badge variant="secondary">5,000</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Daily limit:</span>
                  <Badge variant="secondary">100,000</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Burst limit:</span>
                  <Badge variant="secondary">200/min</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enterprise Plan</CardTitle>
                <CardDescription>High-volume limits for enterprise</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Hourly limit:</span>
                  <Badge>25,000</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Daily limit:</span>
                  <Badge>500,000</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Burst limit:</span>
                  <Badge>1,000/min</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rate Limit Headers</CardTitle>
              <CardDescription>
                Response headers included with every API request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <code className="block p-2 bg-gray-100 rounded text-sm">
                  X-RateLimit-Limit: 25000<br/>
                  X-RateLimit-Remaining: 24950<br/>
                  X-RateLimit-Reset: 1640995200<br/>
                  X-RateLimit-Window: 3600
                </code>
                <p className="text-sm text-muted-foreground mt-2">
                  Use these headers to implement client-side rate limiting and avoid hitting limits.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interactive API Explorer</CardTitle>
              <CardDescription>
                Test API endpoints directly from your browser using Swagger UI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={swaggerContainerRef} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}