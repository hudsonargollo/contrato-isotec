/**
 * Tenant Branding API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { tenantBrandingSchema } from '@/lib/types/tenant';
import { z } from 'zod';

// Update tenant branding
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const tenantId = params.id;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedBranding = tenantBrandingSchema.parse(body);

    // Update tenant branding
    const { data: updatedTenant, error: updateError } = await supabase
      .from('tenants')
      .update({
        branding: validatedBranding,
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId)
      .select('id, name, branding')
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updatedTenant });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get tenant branding
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const tenantId = params.id;

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, name, branding')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: tenant });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}