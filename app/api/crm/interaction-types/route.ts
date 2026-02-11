/**
 * CRM Interaction Types API Routes
 * Handles interaction type management
 * Requirements: 2.4 - Customer interaction tracking system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crmService } from '@/lib/services/crm';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') !== 'false';

    const types = await crmService.getInteractionTypes(tenantId, activeOnly);

    return NextResponse.json(types);
  } catch (error) {
    console.error('Error fetching interaction types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interaction types' },
      { status: 500 }
    );
  }
}