/**
 * CRM Lead Score Calculation API
 * Handles lead score recalculation
 * Requirements: 2.3 - Lead scoring and qualification system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crmService } from '@/lib/services/crm';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const score = await crmService.calculateLeadScore(params.id);

    // Return updated lead with new score
    const lead = await crmService.getLead(params.id);
    
    return NextResponse.json({ 
      score,
      lead 
    });
  } catch (error) {
    console.error('Error calculating lead score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate lead score' },
      { status: 500 }
    );
  }
}