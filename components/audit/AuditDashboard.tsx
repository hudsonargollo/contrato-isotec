/**
 * Audit Dashboard Component
 * 
 * Main dashboard for monitoring user activities, security events, and audit metrics.
 * Provides real-time insights into platform usage and security status.
 * 
 * Requirements: 8.5, 12.3 - User Management and Security Compliance
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { 
  Activity, 
  Shield, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Download,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { AuditDashboardMetrics, UserActivityLog, SecurityEvent } from '@/lib/types/audit';
import { ActivityLogTable } from './ActivityLogTable';
import { SecurityEventsTable } from './SecurityEventsTable';
import { ActivityChart } from './ActivityChart';
import { SecurityMetricsChart } from './SecurityMetricsChart';

interface AuditDashboardProps {
  tenantId: string;
  className?: string;
}

export function AuditDashboard({ tenantId, className }: AuditDashboardProps) {
  const [metrics, setMetrics] = useState<AuditDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });
  const [refreshInterval, setRefreshInterval] = useState<number>(30000); // 30 seconds
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch dashboard metrics
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        tenant_id: tenantId
      });
      
      if (dateRange?.from) {
        params.append('start_date', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('end_date', dateRange.to.toISOString());
      }

      const response = await fetch(`/api/audit/dashboard?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit metrics');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching audit metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [tenantId, dateRange, autoRefresh, refreshInterval]);

  // Export audit report
  const handleExportReport = async (reportType: string) => {
    try {
      const params = new URLSearchParams({
        tenant_id: tenantId,
        report_type: reportType
      });
      
      if (dateRange?.from) {
        params.append('start_date', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('end_date', dateRange.to.toISOString());
      }

      const response = await fetch(`/api/audit/reports/generate?${params}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const { reportId } = await response.json();
      
      // Poll for report completion
      const checkReport = async () => {
        const reportResponse = await fetch(`/api/audit/reports/${reportId}`);
        const report = await reportResponse.json();
        
        if (report.status === 'completed') {
          // Download the report
          window.open(`/api/audit/reports/${reportId}/download`, '_blank');
        } else if (report.status === 'failed') {
          throw new Error('Report generation failed');
        } else {
          // Still generating, check again in 2 seconds
          setTimeout(checkReport, 2000);
        }
      };
      
      checkReport();
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading audit dashboard...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor user activities, security events, and compliance metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
          />
          
          <Select
            value={refreshInterval.toString()}
            onValueChange={(value) => setRefreshInterval(parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10000">10s</SelectItem>
              <SelectItem value="30000">30s</SelectItem>
              <SelectItem value="60000">1m</SelectItem>
              <SelectItem value="300000">5m</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Auto
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Manual
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_activities.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.successful_activities} successful, {metrics?.failed_activities} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.unique_users}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.active_sessions} active sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.security_events}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.critical_events} critical events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.total_activities ? 
                Math.round((metrics.successful_activities / metrics.total_activities) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Activity success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      {metrics?.security_alerts && metrics.security_alerts.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Security Alerts
            </CardTitle>
            <CardDescription>
              Active security events requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.security_alerts.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant={event.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {event.severity}
                    </Badge>
                    <div>
                      <p className="font-medium">{event.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.created_at), 'PPp')}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportReport('user_activity')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Activities
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportReport('security_events')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Security
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Activity Trends</CardTitle>
                <CardDescription>User activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityChart 
                  data={metrics?.top_actions || []}
                  dateRange={dateRange}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Metrics</CardTitle>
                <CardDescription>Security events by severity</CardDescription>
              </CardHeader>
              <CardContent>
                <SecurityMetricsChart 
                  totalEvents={metrics?.security_events || 0}
                  criticalEvents={metrics?.critical_events || 0}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Actions</CardTitle>
                <CardDescription>Most frequent user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.top_actions.slice(0, 5).map((action, index) => (
                    <div key={action.action_type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{action.action_type}</p>
                          <p className="text-sm text-muted-foreground">
                            Last: {format(new Date(action.last_activity), 'PPp')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{action.action_count}</p>
                        <div className="flex items-center space-x-1 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{action.success_count}</span>
                          <XCircle className="h-3 w-3 text-red-500" />
                          <span>{action.failure_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.recent_activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.status === 'success' ? 'bg-green-500' : 
                          activity.status === 'failure' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.resource_name || activity.resource_type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{format(new Date(activity.created_at), 'HH:mm')}</p>
                        <Badge variant={activity.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <ActivityLogTable 
            tenantId={tenantId}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecurityEventsTable 
            tenantId={tenantId}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Reports</CardTitle>
              <CardDescription>
                Create detailed audit reports for compliance and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => handleExportReport('user_activity')}
                >
                  <Activity className="h-6 w-6 mb-2" />
                  User Activity Report
                </Button>
                
                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => handleExportReport('security_events')}
                >
                  <Shield className="h-6 w-6 mb-2" />
                  Security Events Report
                </Button>
                
                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => handleExportReport('login_history')}
                >
                  <Clock className="h-6 w-6 mb-2" />
                  Login History Report
                </Button>
                
                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => handleExportReport('compliance_summary')}
                >
                  <CheckCircle className="h-6 w-6 mb-2" />
                  Compliance Summary
                </Button>
                
                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => handleExportReport('permission_changes')}
                >
                  <Users className="h-6 w-6 mb-2" />
                  Permission Changes
                </Button>
                
                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => handleExportReport('data_access')}
                >
                  <Eye className="h-6 w-6 mb-2" />
                  Data Access Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}