/**
 * Audit System Demo Component
 * 
 * Demonstrates the comprehensive user activity logging and audit system functionality.
 * Shows audit dashboard, activity logging, security monitoring, and reporting features.
 * 
 * Requirements: 8.5, 12.3 - User Management and Security Compliance
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Shield, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

// Mock data for demonstration
const mockAuditMetrics = {
  total_activities: 1247,
  successful_activities: 1198,
  failed_activities: 49,
  unique_users: 23,
  active_sessions: 8,
  security_events: 12,
  critical_events: 2,
  top_actions: [
    {
      action_type: 'leads.create',
      action_count: 156,
      success_count: 154,
      failure_count: 2,
      last_activity: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
    },
    {
      action_type: 'auth.login',
      action_count: 89,
      success_count: 85,
      failure_count: 4,
      last_activity: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    },
    {
      action_type: 'contracts.create',
      action_count: 67,
      success_count: 65,
      failure_count: 2,
      last_activity: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
    },
    {
      action_type: 'users.update',
      action_count: 45,
      success_count: 43,
      failure_count: 2,
      last_activity: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
    }
  ],
  recent_activities: [
    {
      id: '1',
      action: 'leads.create',
      user_id: 'user-123',
      resource_name: 'João Silva - Solar Installation',
      status: 'success',
      ip_address: '192.168.1.100',
      created_at: new Date(Date.now() - 2 * 60 * 1000)
    },
    {
      id: '2',
      action: 'contracts.send',
      user_id: 'user-456',
      resource_name: 'Contract #2024-001',
      status: 'success',
      ip_address: '192.168.1.101',
      created_at: new Date(Date.now() - 5 * 60 * 1000)
    },
    {
      id: '3',
      action: 'auth.login',
      user_id: 'user-789',
      resource_name: null,
      status: 'failure',
      ip_address: '192.168.1.102',
      created_at: new Date(Date.now() - 8 * 60 * 1000),
      error_message: 'Invalid credentials'
    },
    {
      id: '4',
      action: 'invoices.approve',
      user_id: 'user-123',
      resource_name: 'Invoice #INV-2024-045',
      status: 'success',
      ip_address: '192.168.1.100',
      created_at: new Date(Date.now() - 12 * 60 * 1000)
    }
  ],
  security_alerts: [
    {
      id: 'sec-1',
      event_type: 'failed_login',
      severity: 'high',
      description: 'Multiple failed login attempts from IP 192.168.1.102',
      status: 'open',
      created_at: new Date(Date.now() - 8 * 60 * 1000)
    },
    {
      id: 'sec-2',
      event_type: 'unusual_access_pattern',
      severity: 'medium',
      description: 'User accessing system outside normal hours',
      status: 'investigating',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    }
  ]
};

const mockSecurityEvents = [
  {
    id: 'sec-1',
    event_type: 'failed_login',
    severity: 'high',
    description: 'Multiple failed login attempts from IP 192.168.1.102',
    user_id: 'user-789',
    ip_address: '192.168.1.102',
    status: 'open',
    created_at: new Date(Date.now() - 8 * 60 * 1000)
  },
  {
    id: 'sec-2',
    event_type: 'unusual_access_pattern',
    severity: 'medium',
    description: 'User accessing system outside normal hours',
    user_id: 'user-456',
    ip_address: '192.168.1.101',
    status: 'investigating',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 'sec-3',
    event_type: 'permission_violation',
    severity: 'critical',
    description: 'Attempt to access admin functions without proper permissions',
    user_id: 'user-999',
    ip_address: '10.0.0.50',
    status: 'resolved',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    resolved_at: new Date(Date.now() - 23 * 60 * 60 * 1000),
    resolution_notes: 'User account suspended and access revoked'
  }
];

export function AuditSystemDemo() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
      critical: 'destructive'
    } as const;

    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };

    return (
      <Badge variant={variants[severity as keyof typeof variants]} className={colors[severity as keyof typeof colors]}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      failure: 'destructive',
      open: 'destructive',
      investigating: 'secondary',
      resolved: 'default'
    } as const;

    const icons = {
      success: <CheckCircle className="h-3 w-3 mr-1" />,
      failure: <XCircle className="h-3 w-3 mr-1" />,
      open: <AlertTriangle className="h-3 w-3 mr-1" />,
      investigating: <Clock className="h-3 w-3 mr-1" />,
      resolved: <CheckCircle className="h-3 w-3 mr-1" />
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]} className="flex items-center">
        {icons[status as keyof typeof icons]}
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit System Demo</h1>
          <p className="text-muted-foreground">
            Comprehensive user activity logging and security monitoring system
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
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
            <div className="text-2xl font-bold">{mockAuditMetrics.total_activities.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {mockAuditMetrics.successful_activities} successful, {mockAuditMetrics.failed_activities} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAuditMetrics.unique_users}</div>
            <p className="text-xs text-muted-foreground">
              {mockAuditMetrics.active_sessions} active sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAuditMetrics.security_events}</div>
            <p className="text-xs text-muted-foreground">
              {mockAuditMetrics.critical_events} critical events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((mockAuditMetrics.successful_activities / mockAuditMetrics.total_activities) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Activity success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      {mockAuditMetrics.security_alerts.length > 0 && (
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
              {mockAuditMetrics.security_alerts.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getSeverityBadge(event.severity)}
                    <div>
                      <p className="font-medium">{event.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.created_at), 'PPp')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(event.status)}
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Actions</CardTitle>
                <CardDescription>Most frequent user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAuditMetrics.top_actions.map((action, index) => (
                    <div key={action.action_type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{action.action_type}</p>
                          <p className="text-sm text-muted-foreground">
                            Last: {format(new Date(action.last_activity), 'HH:mm')}
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
                  {mockAuditMetrics.recent_activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.resource_name || 'System action'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{format(new Date(activity.created_at), 'HH:mm')}</p>
                        {getStatusBadge(activity.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Detailed log of all user activities in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAuditMetrics.recent_activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">
                          User: {activity.user_id} • IP: {activity.ip_address}
                        </p>
                        {activity.resource_name && (
                          <p className="text-sm text-muted-foreground">
                            Resource: {activity.resource_name}
                          </p>
                        )}
                        {activity.error_message && (
                          <p className="text-sm text-destructive">
                            Error: {activity.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(new Date(activity.created_at), 'MMM d, HH:mm:ss')}
                      </p>
                      {getStatusBadge(activity.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Events
              </CardTitle>
              <CardDescription>
                Security incidents and monitoring alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSecurityEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <AlertTriangle className={`h-5 w-5 ${
                        event.severity === 'critical' ? 'text-red-500' :
                        event.severity === 'high' ? 'text-orange-500' :
                        event.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium">{event.description}</p>
                        <p className="text-sm text-muted-foreground">
                          Type: {event.event_type.replace(/_/g, ' ')} • User: {event.user_id} • IP: {event.ip_address}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.created_at), 'PPp')}
                        </p>
                        {event.resolution_notes && (
                          <p className="text-sm text-green-600 mt-1">
                            Resolution: {event.resolution_notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      {getSeverityBadge(event.severity)}
                      {getStatusBadge(event.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                <Button variant="outline" className="h-24 flex-col">
                  <Activity className="h-6 w-6 mb-2" />
                  User Activity Report
                </Button>
                
                <Button variant="outline" className="h-24 flex-col">
                  <Shield className="h-6 w-6 mb-2" />
                  Security Events Report
                </Button>
                
                <Button variant="outline" className="h-24 flex-col">
                  <Clock className="h-6 w-6 mb-2" />
                  Login History Report
                </Button>
                
                <Button variant="outline" className="h-24 flex-col">
                  <CheckCircle className="h-6 w-6 mb-2" />
                  Compliance Summary
                </Button>
                
                <Button variant="outline" className="h-24 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  Permission Changes
                </Button>
                
                <Button variant="outline" className="h-24 flex-col">
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