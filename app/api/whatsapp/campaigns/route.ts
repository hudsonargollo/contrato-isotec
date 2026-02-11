/**
 * WhatsApp Campaigns API
 * Requirements: 5.3 - Automated lead nurturing campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { whatsappCampaignService } from '@/lib/services/whatsapp-campaigns';
import { getTenantContext } from '@/lib/utils/tenant-context';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const context = await getTenantContext(user.id);
    if (!context) {
      return NextResponse.json({ error: 'Tenant context not found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const campaigns = await whatsappCampaignService.getCampaigns(
      context,
      status,
      limit,
      offset
    );

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Failed to get campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to get campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const context = await getTenantContext(user.id);
    if (!context) {
      return NextResponse.json({ error: 'Tenant context not found' }, { status: 400 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.template_id || !body.audience) {
      return NextResponse.json(
        { error: 'Missing required fields: name, template_id, audience' },
        { status: 400 }
      );
    }

    const campaign = await whatsappCampaignService.createCampaign(context, body);

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Failed to create campaign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create campaign' },
      { status: 500 }
    );
  }
}