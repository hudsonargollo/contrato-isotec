/**
 * Session Management API Route
 * 
 * Provides session information with tenant context and user profile data.
 * Used by client-side components to get current authentication state.
 * 
 * Requirements: 8.1, 12.2 - User Management and Authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantContext, getCurrentTenant, getCurrentTenantUser } from '@/lib/utils/tenant-context';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return NextResponse.json(
        { error: 'Session error: ' + sessionError.message },
        { status: 401 }
      );
    }

    if (!session || !session.user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        profile: null,
        tenant: null,
        tenantUser: null,
        context: null
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    // Get tenant context if available
    const tenant = await getCurrentTenant();
    const tenantUser = await getCurrentTenantUser();
    const context = await getTenantContext();

    // Get user's tenant memberships
    const { data: tenantMemberships } = await supabase
      .from('tenant_users')
      .select(`
        id,
        role,
        status,
        joined_at,
        tenant:tenants(
          id,
          name,
          subdomain,
          branding
        )
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: true });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        created_at: session.user.created_at,
        updated_at: session.user.updated_at
      },
      profile: profile ? {
        ...profile,
        created_at: new Date(profile.created_at),
        updated_at: new Date(profile.updated_at)
      } : null,
      tenant: tenant ? {
        ...tenant,
        created_at: new Date(tenant.created_at),
        updated_at: new Date(tenant.updated_at)
      } : null,
      tenantUser: tenantUser ? {
        ...tenantUser,
        invited_at: tenantUser.invited_at ? new Date(tenantUser.invited_at) : null,
        joined_at: new Date(tenantUser.joined_at),
        last_active_at: new Date(tenantUser.last_active_at),
        created_at: new Date(tenantUser.created_at),
        updated_at: new Date(tenantUser.updated_at)
      } : null,
      context,
      tenantMemberships: tenantMemberships?.map(membership => ({
        ...membership,
        joined_at: new Date(membership.joined_at),
        tenant: membership.tenant ? {
          ...membership.tenant,
          branding: typeof membership.tenant.branding === 'string' 
            ? JSON.parse(membership.tenant.branding) 
            : membership.tenant.branding
        } : null
      })) || []
    });

  } catch (error) {
    console.error('Session API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const supabase = await createClient();

    switch (action) {
      case 'refresh':
        // Refresh the current session
        const { data: { session }, error } = await supabase.auth.refreshSession();
        
        if (error) {
          return NextResponse.json(
            { error: 'Failed to refresh session: ' + error.message },
            { status: 401 }
          );
        }

        return NextResponse.json({
          success: true,
          session: session ? {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            user: session.user
          } : null
        });

      case 'update_activity':
        // Update user's last activity timestamp
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
          );
        }

        // Update last active timestamp in tenant_users if tenant context exists
        const tenantUser = await getCurrentTenantUser();
        if (tenantUser) {
          await supabase
            .from('tenant_users')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', tenantUser.id);
        }

        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Session POST error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}