/**
 * WhatsApp-CRM Analytics Component
 * Requirements: 5.5 - WhatsApp Business Integration with CRM
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  MessageCircle, 
  Users, 
  Link,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

interface WhatsAppCRMAnalyticsData {
  total_conversations: number;
  linked_conversations: number;
  leads_generated: number;
  conversion_rate: number;
  message_volume: {
    inbound: number;
    outbound: number;
    total: number;
  };
  lead_sources: Array<{
    source: string;
    count: number;
    conversion_rate: number;
  }>;
}

export function WhatsAppCRMAnalytics() {
  const [analytics, setAnalytics] = useState<WhatsAppCRMAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      let url = '/api/whatsapp/crm-integration/analytics';
      const params = new URLSearchParams();
      
      if (dateRange?.from) {
        params.append('start_date', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('end_date', dateRange.to.toISOString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No analytics data available</h3>
            <p className="text-muted-foreground">Unable to load WhatsApp-CRM analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const linkingRate = analytics.total_conversations > 0 
    ? (analytics.linked_conversations / analytics.total_conversations) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with Date Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                WhatsApp-CRM Analytics
              </CardTitle>
              <CardDescription>
                Track the performance of your WhatsApp-CRM integration
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
              <Button onClick={loadAnalytics} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_conversations}</div>
            <p className="text-xs text-muted-foreground">
              WhatsApp conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Linked Rate</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{linkingRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.linked_conversations} of {analytics.total_conversations} linked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Generated</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.leads_generated}</div>
            <p className="text-xs text-muted-foreground">
              From WhatsApp conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversion_rate}%</div>
            <p className="text-xs text-muted-foreground">
              Conversations to leads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Message Volume */}
      <Card>
        <CardHeader>
          <CardTitle>Message Volume</CardTitle>
          <CardDescription>
            Breakdown of WhatsApp message activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.message_volume.inbound}
                </div>
                <p className="text-sm text-muted-foreground">Inbound Messages</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.message_volume.outbound}
                </div>
                <p className="text-sm text-muted-foreground">Outbound Messages</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {analytics.message_volume.total}
                </div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
              </div>
            </div>
            
            {/* Simple Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Inbound vs Outbound</span>
                <span>
                  {analytics.message_volume.total > 0 
                    ? `${((analytics.message_volume.inbound / analytics.message_volume.total) * 100).toFixed(1)}% inbound`
                    : 'No messages'
                  }
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ 
                    width: analytics.message_volume.total > 0 
                      ? `${(analytics.message_volume.inbound / analytics.message_volume.total) * 100}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Health */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Health</CardTitle>
          <CardDescription>
            Status of your WhatsApp-CRM integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Conversation Linking</h4>
                <p className="text-sm text-muted-foreground">
                  {analytics.linked_conversations} of {analytics.total_conversations} conversations linked
                </p>
              </div>
              <Badge variant={linkingRate > 80 ? 'default' : linkingRate > 50 ? 'secondary' : 'destructive'}>
                {linkingRate > 80 ? 'Excellent' : linkingRate > 50 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Lead Generation</h4>
                <p className="text-sm text-muted-foreground">
                  {analytics.conversion_rate}% conversion rate from conversations to leads
                </p>
              </div>
              <Badge variant={analytics.conversion_rate > 20 ? 'default' : analytics.conversion_rate > 10 ? 'secondary' : 'destructive'}>
                {analytics.conversion_rate > 20 ? 'High' : analytics.conversion_rate > 10 ? 'Medium' : 'Low'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Message Activity</h4>
                <p className="text-sm text-muted-foreground">
                  {analytics.message_volume.total} total messages processed
                </p>
              </div>
              <Badge variant={analytics.message_volume.total > 100 ? 'default' : 'secondary'}>
                {analytics.message_volume.total > 100 ? 'Active' : 'Low Activity'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>
            Suggestions to improve your WhatsApp-CRM integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {linkingRate < 80 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium text-yellow-800">Improve Conversation Linking</h4>
                  <p className="text-sm text-yellow-700">
                    Consider using the auto-link feature to connect more conversations to existing leads.
                  </p>
                </div>
              </div>
            )}

            {analytics.conversion_rate < 15 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium text-blue-800">Increase Lead Capture</h4>
                  <p className="text-sm text-blue-700">
                    Use the lead capture interface to convert more WhatsApp conversations into CRM leads.
                  </p>
                </div>
              </div>
            )}

            {analytics.message_volume.outbound < analytics.message_volume.inbound * 0.5 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium text-green-800">Increase Proactive Outreach</h4>
                  <p className="text-sm text-green-700">
                    Consider sending more proactive messages to engage with your leads via WhatsApp.
                  </p>
                </div>
              </div>
            )}

            {linkingRate >= 80 && analytics.conversion_rate >= 15 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium text-green-800">Great Job!</h4>
                  <p className="text-sm text-green-700">
                    Your WhatsApp-CRM integration is performing well. Keep up the good work!
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}