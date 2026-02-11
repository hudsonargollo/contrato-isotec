/**
 * Usage Analytics Dashboard Component
 * 
 * Comprehensive dashboard for monitoring API usage, rate limits,
 * performance metrics, and usage trends with detailed analytics.
 * 
 * Requirements: 10.4 - API rate limiting and usage tracking
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Globe,
  Zap,
  Shield,
  Users,
  Calendar
} from 'lucide-react';

interface UsageAnalytics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsPerDay: number;
  topEndpoints: Array<{
    endpoint: string;
    method: string;
    request_count: number;
    avg_response_time: number;
    error_rate: number;
  }>;
  requestsByHour: Array<{ hour: string; count: number }>;
  errorsByStatusCode: Record<number, number>;
  violations: Array<{
    id: string;
    limit_type: string;
    limit_value: number;
    attempted_requests: number;
    endpoint: string;
    violated_at: string;
  }>;
  quotas: Array<{
    period_type: string;
    requests_used: number;
    requests_limit: number;
    period_start: string;
    period_end: string;
  }>;
}

interface RateLimitStatus {
  minute: { limit: number; remaining: number; resetTime: number };
  hour: { limit: number; remaining: number; resetTime: number };
  day: { limit: number; remaining: number; resetTime: number };
}

interface UsageAnalyticsDashboardProps {
  tenantId: string;
  className?: string;
}

export default function UsageAnalyticsDashboard({ tenantId, className }: UsageAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [tenantId, period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/usage-analytics?tenant_id=${tenantId}&period=${period}&include_rate_limit=true`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load usage analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
      setRateLimitStatus(data.currentRateLimit);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load usage analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getSuccessRate = (): number => {
    if (!analytics || analytics.totalRequests === 0) return 0;
    return (analytics.successfulRequests / analytics.totalRequests) * 100;
  };

  const getRateLimitPercentage = (used: number, limit: number): number => {
    return Math.min((used / limit) * 100, 100);
  };

  const getRateLimitStatus = (percentage: number): 'success' | 'warning' | 'danger' => {
    if (percentage < 70) return 'success';
    if (percentage < 90) return 'warning';
    return 'danger';
  };

  const getStatusBadgeVariant = (status: 'success' | 'warning' | 'danger') => {
    switch (status) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'danger': return 'destructive';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (error && !analytics) {
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
            <h2 className="text-2xl font-bold tracking-tight">Usage Analytics</h2>
            <p className="text-muted-foreground">
              Monitor API usage, performance, and rate limits across your platform.
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
            <Button variant="outline" onClick={loadAnalytics} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="violations">Violations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(analytics.totalRequests)}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.requestsPerDay ? `${formatNumber(analytics.requestsPerDay)}/day avg` : 'No daily average'}
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
                      {formatNumber(analytics.successfulRequests)} successful
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Math.round(analytics.averageResponseTime)}ms</div>
                    <p className="text-xs text-muted-foreground">
                      Average response time
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Failed Requests</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(analytics.failedRequests)}</div>
                    <p className="text-xs text-muted-foreground">
                      {((analytics.failedRequests / analytics.totalRequests) * 100).toFixed(1)}% error rate
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Usage Quotas */}
            {analytics?.quotas && analytics.quotas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Usage Quotas</CardTitle>
                  <CardDescription>Current usage against your subscription limits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.quotas.map((quota, index) => {
                      const percentage = getRateLimitPercentage(quota.requests_used, quota.requests_limit);
                      const status = getRateLimitStatus(percentage);
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {quota.period_type.charAt(0).toUpperCase() + quota.period_type.slice(1)}
                              </Badge>
                              <span className="text-sm font-medium">
                                {formatNumber(quota.requests_used)} / {formatNumber(quota.requests_limit)}
                              </span>
                            </div>
                            <Badge variant={getStatusBadgeVariant(status)}>
                              {percentage.toFixed(1)}%
                            </Badge>
                          </div>
                          <Progress value={percentage} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            Period: {new Date(quota.period_start).toLocaleDateString()} - {new Date(quota.period_end).toLocaleDateString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rate-limits" className="space-y-6">
            {/* Current Rate Limit Status */}
            {rateLimitStatus && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Per Minute</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {rateLimitStatus.minute.limit - rateLimitStatus.minute.remaining}
                        </span>
                        <Badge variant={
                          getRateLimitStatus(getRateLimitPercentage(
                            rateLimitStatus.minute.limit - rateLimitStatus.minute.remaining,
                            rateLimitStatus.minute.limit
                          )) === 'success' ? 'default' : 'destructive'
                        }>
                          {getRateLimitPercentage(
                            rateLimitStatus.minute.limit - rateLimitStatus.minute.remaining,
                            rateLimitStatus.minute.limit
                          ).toFixed(1)}%
                        </Badge>
                      </div>
                      <Progress 
                        value={getRateLimitPercentage(
                          rateLimitStatus.minute.limit - rateLimitStatus.minute.remaining,
                          rateLimitStatus.minute.limit
                        )} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(rateLimitStatus.minute.limit)} requests per minute limit
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Per Hour</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {rateLimitStatus.hour.limit - rateLimitStatus.hour.remaining}
                        </span>
                        <Badge variant={
                          getRateLimitStatus(getRateLimitPercentage(
                            rateLimitStatus.hour.limit - rateLimitStatus.hour.remaining,
                            rateLimitStatus.hour.limit
                          )) === 'success' ? 'default' : 'destructive'
                        }>
                          {getRateLimitPercentage(
                            rateLimitStatus.hour.limit - rateLimitStatus.hour.remaining,
                            rateLimitStatus.hour.limit
                          ).toFixed(1)}%
                        </Badge>
                      </div>
                      <Progress 
                        value={getRateLimitPercentage(
                          rateLimitStatus.hour.limit - rateLimitStatus.hour.remaining,
                          rateLimitStatus.hour.limit
                        )} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(rateLimitStatus.hour.limit)} requests per hour limit
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Per Day</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {rateLimitStatus.day.limit - rateLimitStatus.day.remaining}
                        </span>
                        <Badge variant={
                          getRateLimitStatus(getRateLimitPercentage(
                            rateLimitStatus.day.limit - rateLimitStatus.day.remaining,
                            rateLimitStatus.day.limit
                          )) === 'success' ? 'default' : 'destructive'
                        }>
                          {getRateLimitPercentage(
                            rateLimitStatus.day.limit - rateLimitStatus.day.remaining,
                            rateLimitStatus.day.limit
                          ).toFixed(1)}%
                        </Badge>
                      </div>
                      <Progress 
                        value={getRateLimitPercentage(
                          rateLimitStatus.day.limit - rateLimitStatus.day.remaining,
                          rateLimitStatus.day.limit
                        )} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(rateLimitStatus.day.limit)} requests per day limit
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="endpoints" className="space-y-6">
            {/* Top Endpoints */}
            {analytics?.topEndpoints && analytics.topEndpoints.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top API Endpoints</CardTitle>
                  <CardDescription>
                    Most frequently used endpoints and their performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topEndpoints.map((endpoint, index) => (
                      <div key={`${endpoint.endpoint}-${endpoint.method}`} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">#{index + 1}</Badge>
                            <Badge variant="secondary">{endpoint.method}</Badge>
                            <code className="text-sm font-mono">{endpoint.endpoint}</code>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{formatNumber(endpoint.request_count)} requests</span>
                            <span>{Math.round(endpoint.avg_response_time)}ms avg</span>
                            <span>{endpoint.error_rate.toFixed(1)}% error rate</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {((endpoint.request_count / analytics.totalRequests) * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">of total</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="violations" className="space-y-6">
            {/* Rate Limit Violations */}
            {analytics?.violations && analytics.violations.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Rate Limit Violations</CardTitle>
                  <CardDescription>
                    Recent attempts that exceeded rate limits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.violations.map((violation) => (
                      <div key={violation.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">{violation.limit_type}</Badge>
                            <code className="text-sm">{violation.endpoint}</code>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Attempted {violation.attempted_requests} requests (limit: {violation.limit_value})
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatDate(violation.violated_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Rate Limit Violations</h3>
                  <p className="text-muted-foreground">
                    Great! Your API usage is within the rate limits.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}