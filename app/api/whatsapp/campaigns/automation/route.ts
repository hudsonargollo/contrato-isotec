/**
 * Campaign Automation Processing API
 * Requirements: 5.3 - Automated lead nurturing campaigns
 * This endpoint processes automated campaigns based on triggers
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { whatsappCampaignService } from '@/lib/services/whatsapp-campaigns';
import { getTenantContext } from '@/lib/utils/tenant-context';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // This endpoint can be called by a cron job or webhook
    // For security, we'll require an API key or specific authorization
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.CAMPAIGN_AUTOMATION_API_KEY;
    
    if (!authHeader || !apiKey || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenant_id, user_id } = body;

    if (!tenant_id || !user_id) {
      return NextResponse.json(
        { error: 'Missing tenant_id or user_id' },
        { status: 400 }
      );
    }

    const context = {
      tenant_id,
      user_id,
      permissions: [], // System context
      subscription_limits: {}
    };

    await whatsappCampaignService.processAutomatedCampaigns(context);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process automated campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to process automated campaigns' },
      { status: 500 }
    );
  }
}

// Alternative endpoint for manual trigger by authenticated users
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

    await whatsappCampaignService.processAutomatedCampaigns(context);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process automated campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to process automated campaigns' },
      { status: 500 }
    );
  }
}