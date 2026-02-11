/**
 * API Usage Dashboard Component
 * 
 * Dashboard component for monitoring API usage, rate limits, and analytics
 * for enterprise white-label features.
 * 
 * Requirements: 9.5 - Enterprise white-label features
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Globe
} from 'lucide-react';

interface ApiUsageStats {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_response_time_ms: number;
  total_data_transferred_bytes: number;
  top_endpoints: Array<{
    endpoint: string;
    requests: number;
    avg_response_time: number;
  }>;
}

interface ApiUsageDashboardProps {
  tenantId: string;
  className?: string;
}

export default function ApiUsageDashboard({ tenantId, className }: ApiUsageDashboardProps) {
  const [stats, setStats] = useState<ApiUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30d');
  const [rateLimitUsage, setRateLimitUsage] = useState({
    hourly: { used: 0, limit: 25000 },
    daily: { used: 0, limit: 500000 }
  });

  useEffect(() => {
    loadApiUsageStats();
  }, [tenantId, period]);

  const loadApiUsageStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, this would call the API usage stats endpoint
      // For now, we'll simulate the data
      const mockStats: ApiUsageStats = {
        total_requests: 15420,
        successful_requests: 14890,
        failed_requests: 530,
        avg_response_time_ms: 245,
        total_data_transferred_bytes: 1024 * 1024 * 150, // 150MB
        top_endpoints: [
          { endpoint: '/api/leads', requests: 4520, avg_response_time: 180 },
          { endpoint: '/api/contracts', requests: 3210, avg_response_time: 320 },
          { endpoint: '/api/invoices', requests: 2890, avg_response_time: 210 },
          { endpoint: '/api/analytics', requests: 2100, avg_response_time: 450 },
          { endpoint: '/api/whatsapp', requests: 1850, avg_response_time: 150 }
        ]
      };

      // Simulate rate limit usage
      setRateLimitUsage({
        hourly: { used: Math.floor(Math.random() * 20000), limit: 25000 },
        daily: { used: Math.floor(Math.random() * 400000), limit: 500000 }
      });

      setStats(mockStats);
    } catch (error) {
      console.error('Error loading API usage stats:', error);
      setError('Failed to load API usage statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const getSuccessRate = (): number => {
    if (!stats || stats.total_requests === 0) return 0;
    return (stats.successful_requests / stats.total_requests) * 100;
  };

  const getRateLimitPercentage = (used: number, limit: number): number => {
    return (used / limit) * 100;
  };

  const getRateLimitStatus = (percentage: number): 'success' | 'warning' | 'danger' => {
    if (percentage < 70) return 'success';
    if (percentage < 90) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading API usage data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-destructive">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">API Usage Dashboard</h2>
            <p className="text-muted-foreground">
              Monitor your API usage, performance, and rate limits.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadApiUsageStats}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Rate Limit Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hourly Rate Limit</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {formatNumber(rateLimitUsage.hourly.used)}
                  </span>
                  <Badge variant={
                    getRateLimitStatus(getRateLimitPercentage(rateLimitUsage.hourly.used, rateLimitUsage.hourly.limit)) === 'success' ? 'default' :
                    getRateLimitStatus(getRateLimitPercentage(rateLimitUsage.hourly.used, rateLimitUsage.hourly.limit)) === 'warning' ? 'secondary' : 'destructive'
                  }>
                    {getRateLimitPercentage(rateLimitUsage.hourly.used, rateLimitUsage.hourly.limit).toFixed(1)}%
                  </Badge>
                </div>
                <Progress 
                  value={getRateLimitPercentage(rateLimitUsage.hourly.used, rateLimitUsage.hourly.limit)} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {formatNumber(rateLimitUsage.hourly.limit)} requests per hour limit
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Rate Limit</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {formatNumber(rateLimitUsage.daily.used)}
                  </span>
                  <Badge variant={
                    getRateLimitStatus(getRateLimitPercentage(rateLimitUsage.daily.used, rateLimitUsage.daily.limit)) === 'success' ? 'default' :
                    getRateLimitStatus(getRateLimitPercentage(rateLimitUsage.daily.used, rateLimitUsage.daily.limit)) === 'warning' ? 'secondary' : 'destructive'
                  }>
                    {getRateLimitPercentage(rateLimitUsage.daily.used, rateLimitUsage.daily.limit).toFixed(1)}%
                  </Badge>
                </div>
                <Progress 
                  value={getRateLimitPercentage(rateLimitUsage.daily.used, rateLimitUsage.daily.limit)} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {formatNumber(rateLimitUsage.daily.limit)} requests per day limit
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.total_requests)}</div>
                <p className="text-xs text-muted-foreground">
                  {period === '24h' ? 'in the last 24 hours' : `in the last ${period}`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getSuccessRate().toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(stats.successful_requests)} successful requests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avg_response_time_ms}ms</div>
                <p className="text-xs text-muted-foreground">
                  Average response time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Transferred</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(stats.total_data_transferred_bytes)}</div>
                <p className="text-xs text-muted-foreground">
                  Total data transferred
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Endpoints */}
        {stats && stats.top_endpoints.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top API Endpoints</CardTitle>
              <CardDescription>
                Most frequently used endpoints and their performance metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.top_endpoints.map((endpoint, index) => (
                  <div key={endpoint.endpoint} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <code className="text-sm font-mono">{endpoint.endpoint}</code>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(endpoint.requests)} requests • {endpoint.avg_response_time}ms avg
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {((endpoint.requests / stats.total_requests) * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">of total</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}