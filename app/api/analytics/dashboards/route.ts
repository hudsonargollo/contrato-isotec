/**
 * Analytics Dashboards API Route
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
    const includeShared = searchParams.get('include_shared') !== 'false';

    const dashboards = await analyticsService.getDashboards(
      { tenant_id: tenantId, user_id: user.id },
      includeShared
    );

    return NextResponse.json({ dashboards });

  } catch (error) {
    console.error('Failed to get dashboards:', error);
    return NextResponse.json(
      { error: 'Failed to get dashboards' },
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
      name,
      description,
      config,
      is_public = false,
      shared_with = []
    } = body;

    if (!name || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: name, config' },
        { status: 400 }
      );
    }

    // Validate config structure
    if (!config.layout || !Array.isArray(config.widgets)) {
      return NextResponse.json(
        { error: 'Invalid config structure' },
        { status: 400 }
      );
    }

    const dashboard = await analyticsService.createDashboard(
      { tenant_id: tenantId, user_id: user.id },
      {
        name,
        description,
        config,
        is_public,
        shared_with
      }
    );

    return NextResponse.json(dashboard);

  } catch (error) {
    console.error('Failed to create dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to create dashboard' },
      { status: 500 }
    );
  }
}