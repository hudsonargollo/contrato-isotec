/**
 * CRM Scoring Rule Detail API Routes
 * Handles individual scoring rule operations
 * Requirements: 2.3 - Lead scoring and qualification system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crmService } from '@/lib/services/crm';
import type { CreateScoringRuleRequest } from '@/lib/types/crm';

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

    const data: Partial<CreateScoringRuleRequest> = await request.json();

    const rule = await crmService.updateScoringRule(params.id, data);

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error updating scoring rule:', error);
    return NextResponse.json(
      { error: 'Failed to update scoring rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await crmService.deleteScoringRule(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scoring rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete scoring rule' },
      { status: 500 }
    );
  }
}