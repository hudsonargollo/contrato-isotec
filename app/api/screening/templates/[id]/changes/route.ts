/**
 * Screening Template Changes API Routes
 * Handles template change history retrieval
 * Requirements: 3.5 - Template change tracking
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
    const versionId = searchParams.get('version');

    const changes = await screeningService.getTemplateChanges(params.id, versionId || undefined);
    return NextResponse.json(changes);
  } catch (error) {
    console.error('Error fetching template changes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template changes' },
      { status: 500 }
    );
  }
}