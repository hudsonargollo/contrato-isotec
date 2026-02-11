/**
 * Real-time Analytics API Route
 * Requirements: 6.1, 6.2 - Multi-tenant analytics dashboards with real-time updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyticsService } from '@/lib/services/analytics';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.user_metadata?.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const metricsParam = searchParams.get('metrics');
    
    // Default metrics to track in real-time
    const defaultMetrics = [
      'api_request_count',
      'daily_active_users',
      'api_error_count',
      'api_response_time',
      'event_count'
    ];

    const metricNames = metricsParam ? metricsParam.split(',') : defaultMetrics;

    const realTimeMetrics = await analyticsService.getRealTimeMetrics(
      { tenant_id: tenantId, user_id: user.id },
      metricNames
    );

    // Add some computed metrics
    const enhancedMetrics = await enhanceRealTimeMetrics(
      supabase,
      tenantId,
      realTimeMetrics
    );

    return NextResponse.json({ 
      metrics: enhancedMetrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to get real-time metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get real-time metrics' },
      { status: 500 }
    );
  }
}

async function enhanceRealTimeMetrics(
  supabase: any,
  tenantId: string,
  metrics: any[]
) {
  // Set tenant context for RLS
  await supabase.rpc('set_config', {
    setting_name: 'app.current_tenant_id',
    setting_value: tenantId,
    is_local: true
  });

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    // Get current hour event count
    const { data: currentHourEvents } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', oneHourAgo.toISOString());

    // Get today's unique users
    const { data: todayUsers } = await supabase
      .from('analytics_events')
      .select('user_id')
      .eq('tenant_id', tenantId)
      .gte('created_at', oneDayAgo.toISOString())
      .not('user_id', 'is', null);

    const uniqueUsers = new Set(todayUsers?.map(u => u.user_id) || []).size;

    // Get error rate from events
    const { data: errorEvents } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('event_category', 'system')
      .eq('event_action', 'error')
      .gte('created_at', oneHourAgo.toISOString());

    const { data: totalEvents } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', oneHourAgo.toISOString());

    const errorRate = totalEvents && totalEvents.length > 0 
      ? ((errorEvents?.length || 0) / totalEvents.length) * 100 
      : 0;

    // Enhance existing metrics and add computed ones
    const enhancedMetrics = [...metrics];

    // Update or add event count
    const eventCountMetric = enhancedMetrics.find(m => m.metric_name === 'event_count');
    if (eventCountMetric) {
      eventCountMetric.value = currentHourEvents?.length || 0;
    } else {
      enhancedMetrics.push({
        metric_name: 'event_count',
        value: currentHourEvents?.length || 0,
        change: 0,
        change_percentage: 0,
        trend: 'stable' as const,
        last_updated: now
      });
    }

    // Update or add active users
    const activeUsersMetric = enhancedMetrics.find(m => m.metric_name === 'daily_active_users');
    if (activeUsersMetric) {
      activeUsersMetric.value = uniqueUsers;
    } else {
      enhancedMetrics.push({
        metric_name: 'daily_active_users',
        value: uniqueUsers,
        change: 0,
        change_percentage: 0,
        trend: 'stable' as const,
        last_updated: now
      });
    }

    // Add error rate metric
    const errorRateMetric = enhancedMetrics.find(m => m.metric_name === 'error_rate');
    if (errorRateMetric) {
      errorRateMetric.value = Math.round(errorRate * 100) / 100;
    } else {
      enhancedMetrics.push({
        metric_name: 'error_rate',
        value: Math.round(errorRate * 100) / 100,
        change: 0,
        change_percentage: 0,
        trend: errorRate > 5 ? 'up' : errorRate < 1 ? 'down' : 'stable',
        last_updated: now
      });
    }

    // Add system health metric
    const systemHealth = errorRate < 1 ? 100 : errorRate < 5 ? 80 : 60;
    enhancedMetrics.push({
      metric_name: 'system_health',
      value: systemHealth,
      change: 0,
      change_percentage: 0,
      trend: systemHealth > 90 ? 'up' : systemHealth < 70 ? 'down' : 'stable',
      last_updated: now
    });

    return enhancedMetrics;

  } catch (error) {
    console.error('Failed to enhance real-time metrics:', error);
    return metrics; // Return original metrics if enhancement fails
  }
}