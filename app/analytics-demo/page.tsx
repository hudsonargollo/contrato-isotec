/**
 * Analytics Dashboard Demo Page
 * Requirements: 6.1, 6.2 - Multi-tenant analytics dashboards with real-time updates
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity,
  RefreshCw,
  Play,
  Pause,
  Zap,
  Database,
  Globe,
  MessageSquare
} from 'lucide-react';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export default function AnalyticsDemoPage() {
  const [isGeneratingEvents, setIsGeneratingEvents] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [demoStats, setDemoStats] = useState({
    events_generated: 0,
    api_calls: 0,
    users_simulated: 0,
    dashboards_created: 0
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isGeneratingEvents) {
      interval = setInterval(() => {
        generateDemoEvent();
      }, 2000); // Generate event every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGeneratingEvents]);

  const generateDemoEvent = async () => {
    try {
      const eventTypes = [
        {
          event_name: 'lead_created',
          event_category: 'crm',
          event_action: 'create',
          entity_type: 'lead',
          properties: { source: 'website', score: Math.floor(Math.random() * 100) }
        },
        {
          event_name: 'message_sent',
          event_category: 'whatsapp',
          event_action: 'send',
          entity_type: 'message',
          properties: { type: 'text', length: Math.floor(Math.random() * 200) }
        },
        {
          event_name: 'invoice_created',
          event_category: 'invoice',
          event_action: 'create',
          entity_type: 'invoice',
          properties: { amount: Math.floor(Math.random() * 5000) + 100 }
        },
        {
          event_name: 'dashboard_viewed',
          event_category: 'user',
          event_action: 'view',
          entity_type: 'dashboard',
          properties: { duration: Math.floor(Math.random() * 300) + 30 }
        },
        {
          event_name: 'api_request',
          event_category: 'system',
          event_action: 'request',
          entity_type: 'endpoint',
          properties: { response_time: Math.floor(Math.random() * 500) + 50 }
        }
      ];

      const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      const response = await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...randomEvent,
          entity_id: `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })
      });

      if (response.ok) {
        setEventCount(prev => prev + 1);
        setDemoStats(prev => ({
          ...prev,
          events_generated: prev.events_generated + 1,
          api_calls: prev.api_calls + 1,
          users_simulated: Math.min(prev.users_simulated + Math.floor(Math.random() * 2), 50),
          dashboards_created: randomEvent.event_name === 'dashboard_viewed' 
            ? prev.dashboards_created + 1 
            : prev.dashboards_created
        }));
      }
    } catch (error) {
      console.error('Failed to generate demo event:', error);
    }
  };

  const generateBulkEvents = async () => {
    setIsGeneratingEvents(true);
    
    try {
      // Generate 20 events quickly for demo purposes
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(generateDemoEvent());
      }
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to generate bulk events:', error);
    } finally {
      setIsGeneratingEvents(false);
    }
  };

  const toggleEventGeneration = () => {
    setIsGeneratingEvents(!isGeneratingEvents);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Multi-Tenant Analytics Dashboard</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Comprehensive analytics system with real-time dashboards, customizable widgets, 
          and tenant-specific data isolation for SaaS platforms.
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="secondary" className="text-sm">
            <Database className="h-3 w-3 mr-1" />
            Multi-Tenant
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <Zap className="h-3 w-3 mr-1" />
            Real-Time
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <Globe className="h-3 w-3 mr-1" />
            Scalable
          </Badge>
        </div>
      </div>

      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Demo Controls
          </CardTitle>
          <CardDescription>
            Generate sample analytics events to see the dashboard in action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <Button
                onClick={toggleEventGeneration}
                variant={isGeneratingEvents ? "destructive" : "default"}
                className="flex items-center gap-2"
              >
                {isGeneratingEvents ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Stop Auto-Generation
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start Auto-Generation
                  </>
                )}
              </Button>
              
              <Button
                onClick={generateBulkEvents}
                variant="outline"
                disabled={isGeneratingEvents}
              >
                <Zap className="h-4 w-4 mr-2" />
                Generate 20 Events
              </Button>
            </div>

            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg">{demoStats.events_generated}</div>
                <div className="text-muted-foreground">Events</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{demoStats.api_calls}</div>
                <div className="text-muted-foreground">API Calls</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{demoStats.users_simulated}</div>
                <div className="text-muted-foreground">Users</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              Tenant Isolation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Complete data isolation between tenants using Row Level Security (RLS)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Real-Time Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Live metrics and dashboard updates with automatic refresh
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-500" />
              Custom Dashboards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Drag-and-drop dashboard builder with customizable widgets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Advanced Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Comprehensive metrics, funnels, cohorts, and predictive analytics
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="features">
            <Activity className="h-4 w-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="architecture">
            <Database className="h-4 w-4 mr-2" />
            Architecture
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AnalyticsDashboard tenantId="demo-tenant" />
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Tracking</CardTitle>
                <CardDescription>
                  Comprehensive event tracking across all platform components
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">CRM Events</Badge>
                  <span className="text-sm text-muted-foreground">Lead creation, updates, conversions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">WhatsApp Events</Badge>
                  <span className="text-sm text-muted-foreground">Messages, campaigns, templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Invoice Events</Badge>
                  <span className="text-sm text-muted-foreground">Generation, payments, approvals</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">User Events</Badge>
                  <span className="text-sm text-muted-foreground">Logins, actions, preferences</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metrics Collection</CardTitle>
                <CardDescription>
                  Automated metrics aggregation and real-time calculations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Performance</Badge>
                  <span className="text-sm text-muted-foreground">Response times, throughput</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Business</Badge>
                  <span className="text-sm text-muted-foreground">Conversions, revenue, growth</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Usage</Badge>
                  <span className="text-sm text-muted-foreground">Active users, feature adoption</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Quality</Badge>
                  <span className="text-sm text-muted-foreground">Error rates, uptime, reliability</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dashboard Customization</CardTitle>
                <CardDescription>
                  Flexible dashboard builder with drag-and-drop widgets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Charts</Badge>
                  <span className="text-sm text-muted-foreground">Line, bar, pie, area charts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Tables</Badge>
                  <span className="text-sm text-muted-foreground">Data tables with filtering</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Metrics</Badge>
                  <span className="text-sm text-muted-foreground">KPI cards with trends</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Funnels</Badge>
                  <span className="text-sm text-muted-foreground">Conversion funnel analysis</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Multi-Tenant Architecture</CardTitle>
                <CardDescription>
                  Secure, scalable multi-tenancy with complete data isolation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">RLS Policies</Badge>
                  <span className="text-sm text-muted-foreground">Database-level isolation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Tenant Context</Badge>
                  <span className="text-sm text-muted-foreground">Automatic context switching</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Custom Branding</Badge>
                  <span className="text-sm text-muted-foreground">Per-tenant customization</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Scalable</Badge>
                  <span className="text-sm text-muted-foreground">Handles thousands of tenants</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="architecture" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Architecture</CardTitle>
              <CardDescription>
                High-level overview of the multi-tenant analytics system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Globe className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <h3 className="font-semibold">Client Layer</h3>
                    <p className="text-sm text-muted-foreground">
                      React components with real-time updates
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <h3 className="font-semibold">API Layer</h3>
                    <p className="text-sm text-muted-foreground">
                      Next.js API routes with middleware
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Database className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <h3 className="font-semibold">Data Layer</h3>
                    <p className="text-sm text-muted-foreground">
                      Supabase with RLS policies
                    </p>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Key Components:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• <strong>Analytics Service:</strong> Event tracking and metrics collection</li>
                    <li>• <strong>Dashboard Engine:</strong> Customizable widget system</li>
                    <li>• <strong>Real-time Updates:</strong> WebSocket connections for live data</li>
                    <li>• <strong>Tenant Isolation:</strong> RLS policies and context management</li>
                    <li>• <strong>Event Buffer:</strong> Batch processing for high-volume events</li>
                    <li>• <strong>Metrics Aggregation:</strong> Automated rollups and calculations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Indicator */}
      {isGeneratingEvents && (
        <div className="fixed bottom-4 right-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-green-800">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">
                  Generating events... ({eventCount} created)
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}