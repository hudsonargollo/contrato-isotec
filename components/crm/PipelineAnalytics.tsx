/**
 * Pipeline Analytics Component
 * Displays pipeline performance metrics and reporting
 * Requirements: 2.5 - Pipeline analytics and reporting
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Users, Target, Clock, DollarSign } from 'lucide-react';
import type { PipelineAnalytics, LeadPerformanceMetrics } from '@/lib/types/crm';

interface PipelineAnalyticsProps {
  tenantId: string;
}

export function PipelineAnalytics({ tenantId }: PipelineAnalyticsProps) {
  const [analytics, setAnalytics] = useState<PipelineAnalytics | null>(null);
  const [performance, setPerformance] = useState<LeadPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [tenantId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const [analyticsResponse, performanceResponse] = await Promise.all([
        fetch('/api/crm/analytics/pipeline', {
          headers: { 'x-tenant-id': tenantId }
        }),
        fetch('/api/crm/analytics/performance', {
          headers: { 'x-tenant-id': tenantId }
        })
      ]);

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      }

      if (performanceResponse.ok) {
        const performanceData = await performanceResponse.json();
        setPerformance(performanceData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="p-4">No analytics data available</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'contacted': return 'bg-yellow-500';
      case 'qualified': return 'bg-green-500';
      case 'proposal': return 'bg-purple-500';
      case 'negotiation': return 'bg-orange-500';
      case 'closed_won': return 'bg-green-600';
      case 'closed_lost': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      {performance && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold">{performance.total_leads}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+{performance.new_leads_this_month} this month</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">{performance.conversion_rate}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <span className="text-gray-600">{performance.closed_won} won / {performance.total_leads} total</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Lead Score</p>
                <p className="text-2xl font-bold">{performance.avg_lead_score}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <span className="text-gray-600">Quality indicator</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Time to Close</p>
                <p className="text-2xl font-bold">{performance.avg_time_to_close}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <span className="text-gray-600">Sales cycle length</span>
            </div>
          </Card>
        </div>
      )}

      {/* Pipeline Stages */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pipeline Overview</h3>
        <div className="space-y-4">
          {analytics.leads_by_stage.map((stage) => (
            <div key={stage.stage_id} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{stage.stage_name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{stage.lead_count} leads</Badge>
                    <Badge variant="secondary">{stage.conversion_probability}%</Badge>
                  </div>
                </div>
                <Progress 
                  value={stage.conversion_probability} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Avg time: {stage.avg_time_in_stage}</span>
                  <span>{stage.conversion_probability}% conversion</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Lead Status Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Lead Status Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {analytics.leads_by_status.map((status) => (
            <div key={status.status} className="text-center">
              <div className={`w-16 h-16 rounded-full ${getStatusColor(status.status)} mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg`}>
                {status.lead_count}
              </div>
              <p className="font-medium capitalize">{status.status.replace('_', ' ')}</p>
              <p className="text-sm text-gray-600">{status.percentage.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Lead Sources */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Lead Sources</h3>
        <div className="space-y-3">
          {analytics.leads_by_source.map((source) => (
            <div key={source.source_id} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{source.source_name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{source.lead_count} leads</Badge>
                    <Badge variant={source.conversion_rate > 20 ? "default" : "secondary"}>
                      {source.conversion_rate.toFixed(1)}% conversion
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={Math.min(source.conversion_rate, 100)} 
                  className="h-2"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* User Performance */}
      {performance?.user_performance && performance.user_performance.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Team Performance</h3>
          <div className="space-y-3">
            {performance.user_performance.map((user) => (
              <div key={user.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{user.user_name}</p>
                  <p className="text-sm text-gray-600">
                    {user.assigned_leads} leads assigned • {user.closed_deals} closed
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={user.conversion_rate > 20 ? "default" : "secondary"}>
                    {user.conversion_rate.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}