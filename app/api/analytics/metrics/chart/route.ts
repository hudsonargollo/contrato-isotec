/**
 * Analytics Chart Data API Route
 * Requirements: 6.1, 6.2 - Multi-tenant analytics dashboards with real-time updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TimeRange } from '@/lib/types/analytics';

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
    const metric = searchParams.get('metric');
    const type = searchParams.get('type') || 'line';
    const groupBy = searchParams.get('group_by')?.split(',') || [];
    const timeRangeParam = searchParams.get('time_range');

    if (!metric) {
      return NextResponse.json({ error: 'Metric parameter is required' }, { status: 400 });
    }

    let timeRange: TimeRange;
    try {
      timeRange = timeRangeParam ? JSON.parse(timeRangeParam) : {
        type: 'relative',
        relative: { amount: 24, unit: 'hours' }
      };
    } catch {
      timeRange = {
        type: 'relative',
        relative: { amount: 24, unit: 'hours' }
      };
    }

    // Resolve time range to actual dates
    const { start, end } = resolveTimeRange(timeRange);

    // Generate chart data based on metric and grouping
    const chartData = await generateChartData(
      supabase,
      tenantId,
      metric,
      type,
      groupBy,
      start,
      end
    );

    return NextResponse.json(chartData);

  } catch (error) {
    console.error('Failed to get chart data:', error);
    return NextResponse.json(
      { error: 'Failed to get chart data' },
      { status: 500 }
    );
  }
}

function resolveTimeRange(timeRange: TimeRange): { start: Date; end: Date } {
  if (timeRange.type === 'absolute' && timeRange.absolute) {
    return {
      start: timeRange.absolute.start,
      end: timeRange.absolute.end
    };
  }

  if (timeRange.type === 'relative' && timeRange.relative) {
    const now = new Date();
    const { amount, unit } = timeRange.relative;
    
    let milliseconds = 0;
    switch (unit) {
      case 'minutes':
        milliseconds = amount * 60 * 1000;
        break;
      case 'hours':
        milliseconds = amount * 60 * 60 * 1000;
        break;
      case 'days':
        milliseconds = amount * 24 * 60 * 60 * 1000;
        break;
      case 'weeks':
        milliseconds = amount * 7 * 24 * 60 * 60 * 1000;
        break;
      case 'months':
        milliseconds = amount * 30 * 24 * 60 * 60 * 1000;
        break;
    }

    return {
      start: new Date(now.getTime() - milliseconds),
      end: now
    };
  }

  // Default to last 24 hours
  const now = new Date();
  return {
    start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    end: now
  };
}

async function generateChartData(
  supabase: any,
  tenantId: string,
  metric: string,
  chartType: string,
  groupBy: string[],
  start: Date,
  end: Date
) {
  // Set tenant context for RLS
  await supabase.rpc('set_config', {
    setting_name: 'app.current_tenant_id',
    setting_value: tenantId,
    is_local: true
  });

  if (groupBy.length > 0) {
    // Grouped data (for pie charts, grouped bar charts)
    return await generateGroupedChartData(supabase, tenantId, metric, groupBy, start, end);
  } else {
    // Time series data (for line charts, area charts)
    return await generateTimeSeriesChartData(supabase, tenantId, metric, chartType, start, end);
  }
}

async function generateTimeSeriesChartData(
  supabase: any,
  tenantId: string,
  metric: string,
  chartType: string,
  start: Date,
  end: Date
) {
  // Determine appropriate time bucket based on time range
  const timeDiff = end.getTime() - start.getTime();
  const hours = timeDiff / (1000 * 60 * 60);
  
  let bucketSize: string;
  let dateFormat: string;
  
  if (hours <= 24) {
    bucketSize = '1 hour';
    dateFormat = 'HH24:MI';
  } else if (hours <= 168) { // 7 days
    bucketSize = '6 hours';
    dateFormat = 'MM-DD HH24:MI';
  } else if (hours <= 720) { // 30 days
    bucketSize = '1 day';
    dateFormat = 'MM-DD';
  } else {
    bucketSize = '1 week';
    dateFormat = 'MM-DD';
  }

  let query: any;

  if (metric === 'event_count') {
    // Count events over time
    query = supabase
      .from('analytics_events')
      .select('created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());
  } else {
    // Get metrics data
    query = supabase
      .from('analytics_metrics')
      .select('value, period_start')
      .eq('tenant_id', tenantId)
      .eq('metric_name', metric)
      .gte('period_start', start.toISOString())
      .lte('period_start', end.toISOString())
      .order('period_start');
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  // Process data into chart format
  const labels: string[] = [];
  const values: number[] = [];

  if (metric === 'event_count') {
    // Group events by time buckets
    const buckets = new Map<string, number>();
    
    // Generate time buckets
    const current = new Date(start);
    while (current <= end) {
      const label = formatDateForChart(current, dateFormat);
      buckets.set(label, 0);
      
      // Increment by bucket size
      if (bucketSize === '1 hour') {
        current.setHours(current.getHours() + 1);
      } else if (bucketSize === '6 hours') {
        current.setHours(current.getHours() + 6);
      } else if (bucketSize === '1 day') {
        current.setDate(current.getDate() + 1);
      } else if (bucketSize === '1 week') {
        current.setDate(current.getDate() + 7);
      }
    }

    // Count events in each bucket
    data?.forEach((event: any) => {
      const eventDate = new Date(event.created_at);
      const label = formatDateForChart(eventDate, dateFormat);
      const currentCount = buckets.get(label) || 0;
      buckets.set(label, currentCount + 1);
    });

    buckets.forEach((value, label) => {
      labels.push(label);
      values.push(value);
    });
  } else {
    // Use metric values directly
    data?.forEach((item: any) => {
      const date = new Date(item.period_start);
      labels.push(formatDateForChart(date, dateFormat));
      values.push(parseFloat(item.value) || 0);
    });
  }

  return {
    labels,
    datasets: [{
      label: formatMetricName(metric),
      data: values,
      backgroundColor: chartType === 'area' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      fill: chartType === 'area'
    }]
  };
}

async function generateGroupedChartData(
  supabase: any,
  tenantId: string,
  metric: string,
  groupBy: string[],
  start: Date,
  end: Date
) {
  let query: any;
  let groupField = groupBy[0]; // Use first group by field

  if (metric === 'event_count') {
    // Count events by category
    query = supabase
      .from('analytics_events')
      .select(`${groupField}`)
      .eq('tenant_id', tenantId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());
  } else {
    // Get metrics grouped by dimension
    query = supabase
      .from('analytics_metrics')
      .select('value, dimensions')
      .eq('tenant_id', tenantId)
      .eq('metric_name', metric)
      .gte('period_start', start.toISOString())
      .lte('period_start', end.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  // Group and count data
  const groups = new Map<string, number>();

  if (metric === 'event_count') {
    data?.forEach((item: any) => {
      const groupValue = item[groupField] || 'Unknown';
      const currentCount = groups.get(groupValue) || 0;
      groups.set(groupValue, currentCount + 1);
    });
  } else {
    data?.forEach((item: any) => {
      const groupValue = item.dimensions?.[groupField] || 'Unknown';
      const currentValue = groups.get(groupValue) || 0;
      groups.set(groupValue, currentValue + (parseFloat(item.value) || 0));
    });
  }

  const labels = Array.from(groups.keys());
  const values = Array.from(groups.values());

  // Generate colors for pie charts
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
  ];

  return {
    labels,
    datasets: [{
      label: formatMetricName(metric),
      data: values,
      backgroundColor: colors.slice(0, labels.length),
      borderColor: colors.slice(0, labels.length),
      borderWidth: 1
    }]
  };
}

function formatDateForChart(date: Date, format: string): string {
  switch (format) {
    case 'HH24:MI':
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
    case 'MM-DD HH24:MI':
      return date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit' 
      }) + ' ' + date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
    case 'MM-DD':
      return date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit' 
      });
    default:
      return date.toLocaleDateString();
  }
}

function formatMetricName(name: string): string {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}