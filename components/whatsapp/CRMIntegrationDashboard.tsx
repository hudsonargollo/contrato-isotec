/**
 * WhatsApp-CRM Integration Dashboard
 * Requirements: 5.5 - WhatsApp Business Integration with CRM
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Link, 
  UserPlus,
  BarChart3,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { ConversationLinkingInterface } from './ConversationLinkingInterface';
import { LeadCaptureInterface } from './LeadCaptureInterface';
import { WhatsAppCRMAnalytics } from './WhatsAppCRMAnalytics';

interface CRMIntegrationStats {
  total_conversations: number;
  linked_conversations: number;
  leads_generated: number;
  conversion_rate: number;
  message_volume: {
    inbound: number;
    outbound: number;
    total: number;
  };
}

export function CRMIntegrationDashboard() {
  const [stats, setStats] = useState<CRMIntegrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoLinking, setAutoLinking] = useState(false);
  const [autoLinkResult, setAutoLinkResult] = useState<{
    linked_count: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/whatsapp/crm-integration/analytics');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load CRM integration stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoLink = async () => {
    try {
      setAutoLinking(true);
      const response = await fetch('/api/whatsapp/crm-integration/auto-link', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAutoLinkResult(data.data);
        await loadStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Auto-link failed:', error);
    } finally {
      setAutoLinking(false);
    }
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
          <h1 className="text-3xl font-bold">WhatsApp-CRM Integration</h1>
          <p className="text-muted-foreground">
            Connect WhatsApp conversations to your CRM leads and track customer interactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleAutoLink}
            disabled={autoLinking}
            variant="outline"
          >
            {autoLinking ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Link className="h-4 w-4 mr-2" />
            )}
            Auto-Link Conversations
          </Button>
          <Button onClick={loadStats} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Auto-link Results */}
      {autoLinkResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Auto-Link Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">{autoLinkResult.linked_count}</span> conversations linked successfully
              </p>
              {autoLinkResult.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm text-destructive font-medium">
                    {autoLinkResult.errors.length} errors occurred:
                  </p>
                  {autoLinkResult.errors.slice(0, 3).map((error, index) => (
                    <p key={index} className="text-xs text-muted-foreground">
                      {error}
                    </p>
                  ))}
                  {autoLinkResult.errors.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      ... and {autoLinkResult.errors.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_conversations}</div>
              <p className="text-xs text-muted-foreground">
                WhatsApp conversations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Linked Conversations</CardTitle>
              <Link className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.linked_conversations}</div>
              <p className="text-xs text-muted-foreground">
                Connected to CRM leads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Generated</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.leads_generated}</div>
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
              <div className="text-2xl font-bold">{stats.conversion_rate}%</div>
              <p className="text-xs text-muted-foreground">
                Conversations to leads
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Interface */}
      <Tabs defaultValue="linking" className="space-y-4">
        <TabsList>
          <TabsTrigger value="linking">
            <Link className="h-4 w-4 mr-2" />
            Link Conversations
          </TabsTrigger>
          <TabsTrigger value="capture">
            <UserPlus className="h-4 w-4 mr-2" />
            Capture Leads
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="linking">
          <ConversationLinkingInterface onLinkSuccess={loadStats} />
        </TabsContent>

        <TabsContent value="capture">
          <LeadCaptureInterface onCaptureSuccess={loadStats} />
        </TabsContent>

        <TabsContent value="analytics">
          <WhatsAppCRMAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}