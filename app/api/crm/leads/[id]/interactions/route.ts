/**
 * CRM Lead Interactions API
 * Handles interaction tracking for specific leads
 * Requirements: 2.4 - Customer interaction tracking system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crmService } from '@/lib/services/crm';
import type { CreateInteractionRequest } from '@/lib/types/crm';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const interactions = await crmService.getLeadInteractions(params.id);

    return NextResponse.json(interactions);
  } catch (error) {
    console.error('Error fetching lead interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const data: Omit<CreateInteractionRequest, 'lead_id'> = await request.json();

    // Validate required fields
    if (!data.content || !data.channel) {
      return NextResponse.json(
        { error: 'Content and channel are required' },
        { status: 400 }
      );
    }

    const interaction = await crmService.createInteraction(tenantId, {
      ...data,
      lead_id: params.id
    });

    return NextResponse.json(interaction, { status: 201 });
  } catch (error) {
    console.error('Error creating interaction:', error);
    return NextResponse.json(
      { error: 'Failed to create interaction' },
      { status: 500 }
    );
  }
}