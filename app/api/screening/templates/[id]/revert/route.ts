/**
 * Screening Template Version Revert API Route
 * Handles template version reversion
 * Requirements: 3.5 - Template version control
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { screeningService } from '@/lib/services/screening';

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
    const { target_version, revert_notes } = body;

    if (!target_version) {
      return NextResponse.json(
        { error: 'Target version is required' },
        { status: 400 }
      );
    }

    const revertedTemplate = await screeningService.revertToVersion(
      params.id,
      tenantId,
      target_version,
      revert_notes
    );

    return NextResponse.json(revertedTemplate);
  } catch (error) {
    console.error('Error reverting template version:', error);
    return NextResponse.json(
      { error: 'Failed to revert template version' },
      { status: 500 }
    );
  }
}