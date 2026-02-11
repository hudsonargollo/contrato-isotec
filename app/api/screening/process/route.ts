/**
 * Screening Processing API
 * Handles automated project screening and scoring
 * Requirements: 3.2, 3.3 - Automated feasibility assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { screeningService } from '@/lib/services/screening';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant context
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const { response_id, template_id } = await request.json();

    if (!response_id) {
      return NextResponse.json(
        { error: 'Response ID is required' },
        { status: 400 }
      );
    }

    // Get the questionnaire response
    const { data: response, error: responseError } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('id', response_id)
      .single();

    if (responseError || !response) {
      return NextResponse.json(
        { error: 'Questionnaire response not found' },
        { status: 404 }
      );
    }

    // Process screening
    const screeningResult = await screeningService.processScreening(
      tenantId,
      response,
      template_id
    );

    return NextResponse.json(screeningResult);
  } catch (error) {
    console.error('Error processing screening:', error);
    return NextResponse.json(
      { error: 'Failed to process screening' },
      { status: 500 }
    );
  }
}