/**
 * Analytics Metrics API Route
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
    const metricName = searchParams.get('metric_name');
    const metricCategory = searchParams.get('metric_category');
    const periodType = searchParams.get('period_type');
    const timeRange = searchParams.get('time_range');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build filters
    const filters: any = {};
    
    if (metricName) {
      filters.metric_name = metricName;
    }
    
    if (metricCategory) {
      filters.metric_category = metricCategory;
    }

    if (periodType) {
      filters.period_type = periodType;
    }

    if (timeRange) {
      try {
        filters.time_range = JSON.parse(timeRange);
      } catch {
        // Use default time range if parsing fails
        filters.time_range = {
          type: 'relative',
          relative: { amount: 24, unit: 'hours' }
        };
      }
    }

    const metrics = await analyticsService.getMetrics(
      { tenant_id: tenantId, user_id: user.id },
      filters,
      limit
    );

    return NextResponse.json({ metrics });

  } catch (error) {
    console.error('Failed to get analytics metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      metric_name,
      value,
      metric_type = 'counter',
      category = 'custom',
      dimensions = {},
      period_type = 'hour'
    } = body;

    if (!metric_name || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: metric_name, value' },
        { status: 400 }
      );
    }

    await analyticsService.recordMetric(
      { tenant_id: tenantId, user_id: user.id },
      metric_name,
      value,
      metric_type,
      category,
      dimensions,
      period_type
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to record analytics metric:', error);
    return NextResponse.json(
      { error: 'Failed to record analytics metric' },
      { status: 500 }
    );
  }
}