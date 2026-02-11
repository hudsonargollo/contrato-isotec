/**
 * Analytics Dashboard by ID API Route
 * Requirements: 6.1, 6.2 - Multi-tenant analytics dashboards with real-time updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Set tenant context for RLS
    await supabase.rpc('set_config', {
      setting_name: 'app.current_tenant_id',
      setting_value: tenantId,
      is_local: true
    });

    const { data: dashboard, error } = await supabase
      .from('analytics_dashboards')
      .select('*')
      .eq('id', params.id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
      }
      throw error;
    }

    // Check if user has access to this dashboard
    const hasAccess = dashboard.user_id === user.id || 
                     dashboard.is_public || 
                     dashboard.shared_with?.includes(user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(dashboard);

  } catch (error) {
    console.error('Failed to get dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to get dashboard' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Set tenant context for RLS
    await supabase.rpc('set_config', {
      setting_name: 'app.current_tenant_id',
      setting_value: tenantId,
      is_local: true
    });

    // Check if dashboard exists and user has permission to edit
    const { data: existingDashboard, error: fetchError } = await supabase
      .from('analytics_dashboards')
      .select('user_id')
      .eq('id', params.id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
      }
      throw fetchError;
    }

    // Only the owner can edit the dashboard
    if (existingDashboard.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      config,
      is_public,
      shared_with
    } = body;

    // Validate config if provided
    if (config && (!config.layout || !Array.isArray(config.widgets))) {
      return NextResponse.json(
        { error: 'Invalid config structure' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (config !== undefined) updateData.config = config;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (shared_with !== undefined) updateData.shared_with = shared_with;

    const { data: updatedDashboard, error: updateError } = await supabase
      .from('analytics_dashboards')
      .update(updateData)
      .eq('id', params.id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(updatedDashboard);

  } catch (error) {
    console.error('Failed to update dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to update dashboard' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Set tenant context for RLS
    await supabase.rpc('set_config', {
      setting_name: 'app.current_tenant_id',
      setting_value: tenantId,
      is_local: true
    });

    // Check if dashboard exists and user has permission to delete
    const { data: existingDashboard, error: fetchError } = await supabase
      .from('analytics_dashboards')
      .select('user_id')
      .eq('id', params.id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
      }
      throw fetchError;
    }

    // Only the owner can delete the dashboard
    if (existingDashboard.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('analytics_dashboards')
      .delete()
      .eq('id', params.id)
      .eq('tenant_id', tenantId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to delete dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to delete dashboard' },
      { status: 500 }
    );
  }
}