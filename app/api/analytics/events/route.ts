/**
 * Analytics Events API Route
 * Requirements: 6.1, 6.2 - Multi-tenant analytics dashboards with real-time updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyticsService } from '@/lib/services/analytics';
import type { EventTrackingContext } from '@/lib/types/analytics';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant context from user metadata or session
    const tenantId = user.user_metadata?.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const category = searchParams.get('category');
    const action = searchParams.get('action');
    const search = searchParams.get('search');
    const timeRange = searchParams.get('time_range');

    // Build filters
    const filters: any = {};
    
    if (category && category !== 'all') {
      filters.event_category = category;
    }
    
    if (action && action !== 'all') {
      filters.event_action = action;
    }

    if (search) {
      filters.event_name = search;
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

    const offset = (page - 1) * limit;
    const events = await analyticsService.getEvents(
      { tenant_id: tenantId, user_id: user.id },
      filters,
      limit,
      offset
    );

    // Get total count for pagination
    let query = supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    if (filters.event_category) {
      query = query.eq('event_category', filters.event_category);
    }
    if (filters.event_action) {
      query = query.eq('event_action', filters.event_action);
    }
    if (filters.event_name) {
      query = query.ilike('event_name', `%${filters.event_name}%`);
    }

    const { count } = await query;

    return NextResponse.json({
      events,
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    });

  } catch (error) {
    console.error('Failed to get analytics events:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics events' },
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
      event_name,
      event_category,
      event_action,
      entity_type,
      entity_id,
      properties = {},
      metadata = {}
    } = body;

    if (!event_name || !event_category || !event_action) {
      return NextResponse.json(
        { error: 'Missing required fields: event_name, event_category, event_action' },
        { status: 400 }
      );
    }

    // Get client IP and user agent
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    const trackingContext: EventTrackingContext = {
      tenant_id: tenantId,
      user_id: user.id,
      session_id: request.headers.get('x-session-id') || undefined,
      ip_address: ip,
      user_agent: userAgent
    };

    const eventId = await analyticsService.trackEvent({
      event_name,
      event_category,
      event_action,
      entity_type,
      entity_id,
      properties,
      metadata
    }, trackingContext);

    return NextResponse.json({ event_id: eventId });

  } catch (error) {
    console.error('Failed to track analytics event:', error);
    return NextResponse.json(
      { error: 'Failed to track analytics event' },
      { status: 500 }
    );
  }
}