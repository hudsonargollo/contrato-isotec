/**
 * Screening Template Consistency API Routes
 * Handles assessment consistency tracking and validation
 * Requirements: 3.5 - Historical assessment consistency
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

    const consistencyHistory = await screeningService.getConsistencyHistory(params.id);
    return NextResponse.json(consistencyHistory);
  } catch (error) {
    console.error('Error fetching consistency history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consistency history' },
      { status: 500 }
    );
  }
}