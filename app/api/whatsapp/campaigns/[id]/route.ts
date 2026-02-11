/**
 * WhatsApp Campaign Management API
 * Requirements: 5.3 - Automated lead nurturing campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { whatsappCampaignService } from '@/lib/services/whatsapp-campaigns';
import { getTenantContext } from '@/lib/utils/tenant-context';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const campaign = await whatsappCampaignService.getCampaign(params.id, context);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Failed to get campaign:', error);
    return NextResponse.json(
      { error: 'Failed to get campaign' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const campaign = await whatsappCampaignService.updateCampaign(
      params.id,
      body,
      context
    );

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Failed to update campaign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await whatsappCampaignService.cancelCampaign(params.id, context);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to cancel campaign:', error);
    return NextResponse.json(
      { error: 'Failed to cancel campaign' },
      { status: 500 }
    );
  }
}