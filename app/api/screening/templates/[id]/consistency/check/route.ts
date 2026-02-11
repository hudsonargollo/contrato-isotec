/**
 * Screening Template Consistency Check API Route
 * Handles consistency check execution
 * Requirements: 3.5 - Historical assessment consistency
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
    const { start_date, end_date } = body;

    if (!start_date || !end_date) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const consistencyCheck = await screeningService.checkAssessmentConsistency(
      params.id,
      tenantId,
      new Date(start_date),
      new Date(end_date)
    );

    return NextResponse.json(consistencyCheck);
  } catch (error) {
    console.error('Error checking assessment consistency:', error);
    return NextResponse.json(
      { error: 'Failed to check assessment consistency' },
      { status: 500 }
    );
  }
}