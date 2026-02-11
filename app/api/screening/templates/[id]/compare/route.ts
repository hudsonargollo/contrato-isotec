/**
 * Screening Template Version Comparison API Route
 * Handles version comparison functionality
 * Requirements: 3.5 - Template version control
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

    const searchParams = request.nextUrl.searchParams;
    const fromVersion = searchParams.get('from');
    const toVersion = searchParams.get('to');

    if (!fromVersion || !toVersion) {
      return NextResponse.json(
        { error: 'Both from and to version parameters are required' },
        { status: 400 }
      );
    }

    const comparison = await screeningService.compareTemplateVersions(
      params.id,
      fromVersion,
      toVersion
    );

    return NextResponse.json(comparison);
  } catch (error) {
    console.error('Error comparing template versions:', error);
    return NextResponse.json(
      { error: 'Failed to compare template versions' },
      { status: 500 }
    );
  }
}