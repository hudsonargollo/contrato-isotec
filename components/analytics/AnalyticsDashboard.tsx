/**
 * Analytics Dashboard Component
 * Requirements: 6.1 - Analytics data collection system
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity,
  RefreshCw,
  Settings,
  Eye,
  Calendar
} from 'lucide-react';
import { RealTimeMetrics } from './RealTimeMetrics';
import { EventsTable } from './EventsTable';
import { MetricsChart } from './MetricsChart';
import { CustomDashboard } from './CustomDashboard';
import type { RealTimeMetric } from '@/lib/types/analytics';

interface AnalyticsDashboardProps {
  tenantId: string;
}

interface DashboardStats {
  total_events: number;
  active_users: number;
  api_requests: number;
  error_rate: number;
  avg_response_time: number;
}

export function AnalyticsDashboard({ tenantId }: AnalyticsDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates
    const interval = setInterval(loadRealTimeMetrics, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard stats
      await Promise.all([
        loadStats(),
        loadRealTimeMetrics()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get events from last 24 hours
      const eventsResponse = await fetch('/api/analytics/events?time_range=24');
      const eventsData = await eventsResponse.json();

      // Get metrics
      const metricsResponse = await fetch('/api/analytics/metrics?time_range=24');
      const metricsData = await metricsResponse.json();

      // Calculate stats from the data
      const totalEvents = eventsData.count || 0;
      const activeUsers = new Set(
        eventsData.events?.filter((e: any) => e.user_id).map((e: any) => e.user_id) || []
      ).size;

      const apiRequests = metricsData.metrics?.find((m: any) => m.metric_name === 'api_request_count')?.value || 0;
      const errorCount = metricsData.metrics?.find((m: any) => m.metric_name === 'api_error_count')?.value || 0;
      const avgResponseTime = metricsData.metrics?.find((m: any) => m.metric_name === 'api_response_time')?.value || 0;

      const errorRate = apiRequests > 0 ? (errorCount / apiRequests) * 100 : 0;

      setStats({
        total_events: totalEvents,
        active_users: activeUsers,
        api_requests: apiRequests,
        error_rate: Math.round(errorRate * 100) / 100,
        avg_response_time: Math.round(avgResponseTime)
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadRealTimeMetrics = async () => {
    try {
      const response = await fetch('/api/analytics/realtime');
      if (response.ok) {
        const data = await response.json();
        setRealTimeMetrics(data.metrics || []);
      }
    } catch (error) {
      console.error('Failed to load real-time metrics:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor platform performance and user engagement
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_events.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_users}</div>
              <p className="text-xs text-muted-foreground">Unique users today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Requests</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.api_requests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.error_rate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.error_rate < 1 ? 'Excellent' : stats.error_rate < 5 ? 'Good' : 'Needs attention'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avg_response_time}ms</div>
              <p className="text-xs text-muted-foreground">
                {stats.avg_response_time < 200 ? 'Fast' : stats.avg_response_time < 500 ? 'Good' : 'Slow'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-time Metrics */}
      <RealTimeMetrics metrics={realTimeMetrics} />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="events">
            <Activity className="h-4 w-4 mr-2" />
            Events
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Eye className="h-4 w-4 mr-2" />
            Custom
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Categories</CardTitle>
                <CardDescription>Distribution of events by category</CardDescription>
              </CardHeader>
              <CardContent>
                <MetricsChart
                  type="pie"
                  metric="event_count"
                  groupBy={['event_category']}
                  timeRange={{ type: 'relative', relative: { amount: 24, unit: 'hours' } }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Response Times</CardTitle>
                <CardDescription>Average response time over time</CardDescription>
              </CardHeader>
              <CardContent>
                <MetricsChart
                  type="line"
                  metric="api_response_time"
                  timeRange={{ type: 'relative', relative: { amount: 24, unit: 'hours' } }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Active users over time</CardDescription>
              </CardHeader>
              <CardContent>
                <MetricsChart
                  type="area"
                  metric="daily_active_users"
                  timeRange={{ type: 'relative', relative: { amount: 7, unit: 'days' } }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Trends</CardTitle>
                <CardDescription>Error count and rate trends</CardDescription>
              </CardHeader>
              <CardContent>
                <MetricsChart
                  type="bar"
                  metric="api_error_count"
                  timeRange={{ type: 'relative', relative: { amount: 24, unit: 'hours' } }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events">
          <EventsTable />
        </TabsContent>

        <TabsContent value="metrics">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">System Metrics</h3>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Time Range
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MetricsChart
                type="line"
                metric="api_request_count"
                title="API Request Volume"
                timeRange={{ type: 'relative', relative: { amount: 7, unit: 'days' } }}
              />
              
              <MetricsChart
                type="line"
                metric="api_response_time"
                title="Response Time Trends"
                timeRange={{ type: 'relative', relative: { amount: 7, unit: 'days' } }}
              />
              
              <MetricsChart
                type="bar"
                metric="event_count"
                title="Event Volume by Category"
                groupBy={['event_category']}
                timeRange={{ type: 'relative', relative: { amount: 24, unit: 'hours' } }}
              />
              
              <MetricsChart
                type="pie"
                metric="api_request_count"
                title="Requests by Endpoint"
                groupBy={['path']}
                timeRange={{ type: 'relative', relative: { amount: 24, unit: 'hours' } }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="custom">
          <CustomDashboard tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}