/**
 * Screening Template Version History API Routes
 * Handles version control operations for screening templates
 * Requirements: 3.5 - Template version control and historical consistency
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { screeningService } from '@/lib/services/screening';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const versions = await screeningService.getTemplateVersionHistory(params.id);
    return NextResponse.json(versions);
  } catch (error) {
    console.error('Error fetching template version history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template version history' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { version_notes, auto_increment = true } = body;

    const newVersion = await screeningService.createTemplateVersion(
      params.id,
      tenantId,
      version_notes,
      auto_increment
    );

    return NextResponse.json(newVersion, { status: 201 });
  } catch (error) {
    console.error('Error creating template version:', error);
    return NextResponse.json(
      { error: 'Failed to create template version' },
      { status: 500 }
    );
  }
}