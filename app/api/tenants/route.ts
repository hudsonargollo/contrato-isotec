/**
 * Tenants API Routes
 * 
 * API endpoints for managing tenants in the multi-tenant system.
 * Handles tenant creation, listing, and management operations.
 * 
 * Requirements: 1.1, 1.2, 1.5 - Multi-Tenant Architecture
 */

import { NextRequest, NextResponse } from 'next/server';
import { TenantService } from '@/lib/services/tenant';
import { createTenantSchema } from '@/lib/types/tenant';
import { createTenantSupabaseClient, hasPermission } from '@/lib/utils/tenant-context';

const tenantService = new TenantService();

/**
 * GET /api/tenants
 * List all tenants (super admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createTenantSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const tenants = await tenantService.listTenants(limit, offset);

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('Error listing tenants:', error);
    return NextResponse.json(
      { error: 'Failed to list tenants' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tenants
 * Create a new tenant (super admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createTenantSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = createTenantSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const tenantData = validationResult.data;

    // Check if domain/subdomain already exists
    const existingByDomain = await tenantService.getTenantByDomain(tenantData.domain);
    if (existingByDomain) {
      return NextResponse.json(
        { error: 'Domain already exists' },
        { status: 409 }
      );
    }

    const existingBySubdomain = await tenantService.getTenantBySubdomain(tenantData.subdomain);
    if (existingBySubdomain) {
      return NextResponse.json(
        { error: 'Subdomain already exists' },
        { status: 409 }
      );
    }

    // Create tenant
    const tenant = await tenantService.createTenant(tenantData);

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}