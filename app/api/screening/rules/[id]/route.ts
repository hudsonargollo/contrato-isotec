/**
 * Individual Screening Rule API Routes
 * Handles operations for specific screening rules
 * Requirements: 3.2 - Configurable scoring rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { screeningService } from '@/lib/services/screening';
import { updateScreeningRuleSchema } from '@/lib/types/screening';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = updateScreeningRuleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid rule data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const rule = await screeningService.updateScreeningRule(params.id, validationResult.data);
    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error updating screening rule:', error);
    return NextResponse.json(
      { error: 'Failed to update screening rule' },
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
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await screeningService.deleteScreeningRule(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting screening rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete screening rule' },
      { status: 500 }
    );
  }
}