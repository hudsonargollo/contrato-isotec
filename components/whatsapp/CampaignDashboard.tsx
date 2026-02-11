/**
 * WhatsApp Campaign Dashboard
 * Requirements: 5.3 - Automated lead nurturing campaigns with performance tracking
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock,
  Zap,
  BarChart3,
  Send,
  Eye
} from 'lucide-react';
import CampaignManager from './CampaignManager';
import CampaignAutomation from './CampaignAutomation';

interface CampaignDashboardProps {
  tenantId: string;
}

interface DashboardStats {
  total_campaigns: number;
  active_campaigns: number;
  total_messages_sent: number;
  total_recipients: number;
  avg_delivery_rate: number;
  avg_read_rate: number;
  automation_rules: number;
  active_automations: number;
}

export default function CampaignDashboard({ tenantId }: CampaignDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would fetch actual stats from the API
      // For now, we'll use mock data
      const mockStats: DashboardStats = {
        total_campaigns: 12,
        active_campaigns: 3,
        total_messages_sent: 1247,
        total_recipients: 856,
        avg_delivery_rate: 94.2,
        avg_read_rate: 67.8,
        automation_rules: 5,
        active_automations: 4
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">WhatsApp Campaigns</h1>
        <p className="text-gray-600">Manage automated lead nurturing and customer engagement</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_campaigns}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_campaigns} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_messages_sent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                To {stats.total_recipients} recipients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avg_delivery_rate}%</div>
              <p className="text-xs text-muted-foreground">
                Average across all campaigns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Read Rate</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avg_read_rate}%</div>
              <p className="text-xs text-muted-foreground">
                Messages opened by recipients
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Automation Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Automation Rules</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.automation_rules}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_automations} currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((stats.avg_delivery_rate + stats.avg_read_rate) / 2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Combined delivery & read rates
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Campaign Manager
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automation Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <CampaignManager tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <CampaignAutomation tenantId={tenantId} />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for campaign management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardContent className="flex items-center space-x-3 p-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Create Campaign</h4>
                  <p className="text-sm text-gray-600">Start a new nurturing campaign</p>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardContent className="flex items-center space-x-3 p-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Zap className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Add Automation</h4>
                  <p className="text-sm text-gray-600">Set up journey-based triggers</p>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardContent className="flex items-center space-x-3 p-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">View Analytics</h4>
                  <p className="text-sm text-gray-600">Analyze campaign performance</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest campaign and automation events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-green-100 rounded-full">
                <Send className="h-3 w-3 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Welcome Campaign completed</p>
                <p className="text-xs text-gray-600">Sent 45 messages with 94% delivery rate</p>
              </div>
              <div className="text-xs text-gray-500">2 hours ago</div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-1 bg-blue-100 rounded-full">
                <Zap className="h-3 w-3 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">New automation rule triggered</p>
                <p className="text-xs text-gray-600">Follow-up message sent to 12 inactive leads</p>
              </div>
              <div className="text-xs text-gray-500">4 hours ago</div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-1 bg-yellow-100 rounded-full">
                <Clock className="h-3 w-3 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Campaign scheduled</p>
                <p className="text-xs text-gray-600">Product Demo campaign set for tomorrow 9 AM</p>
              </div>
              <div className="text-xs text-gray-500">6 hours ago</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}