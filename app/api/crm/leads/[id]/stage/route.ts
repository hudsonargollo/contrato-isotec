/**
 * CRM Lead Stage Update API
 * Handles lead stage transitions with history tracking
 * Requirements: 2.2 - Sales pipeline and stage management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crmService } from '@/lib/services/crm';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stage_id, reason, notes } = await request.json();

    if (!stage_id) {
      return NextResponse.json(
        { error: 'Stage ID is required' },
        { status: 400 }
      );
    }

    await crmService.updateLeadStage(params.id, stage_id, reason, notes);

    // Return updated lead
    const lead = await crmService.getLead(params.id);
    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error updating lead stage:', error);
    return NextResponse.json(
      { error: 'Failed to update lead stage' },
      { status: 500 }
    );
  }
}