/**
 * CRM Pipeline Analytics API
 * Provides pipeline performance metrics and reporting
 * Requirements: 2.5 - Pipeline analytics and reporting
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

    const analytics = await crmService.getPipelineAnalytics(tenantId);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching pipeline analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline analytics' },
      { status: 500 }
    );
  }
}