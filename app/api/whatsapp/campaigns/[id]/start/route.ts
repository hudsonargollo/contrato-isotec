/**
 * Start WhatsApp Campaign API
 * Requirements: 5.3 - Automated lead nurturing campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { whatsappCampaignService } from '@/lib/services/whatsapp-campaigns';
import { getTenantContext } from '@/lib/utils/tenant-context';

export async function POST(
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

    const result = await whatsappCampaignService.startCampaign(params.id, context);

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Failed to start campaign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start campaign' },
      { status: 500 }
    );
  }
}