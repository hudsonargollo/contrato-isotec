/**
 * Screening Results API Route
 * Handles screening result queries and analytics
 * Requirements: 3.2, 3.3 - Screening results and analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const responseId = searchParams.get('response_id');
    const templateId = searchParams.get('template_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createClient();
    let query = supabase
      .from('screening_results')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (responseId) {
      query = query.eq('response_id', responseId);
    }

    if (templateId) {
      query = query.eq('template_id', templateId);
    }

    const { data: results, error } = await query;

    if (error) throw error;

    // Transform dates
    const transformedResults = results?.map(result => ({
      ...result,
      calculation_metadata: {
        ...result.calculation_metadata,
        calculated_at: new Date(result.calculation_metadata.calculated_at)
      },
      created_at: new Date(result.created_at),
      updated_at: new Date(result.updated_at)
    })) || [];

    return NextResponse.json(transformedResults);
  } catch (error) {
    console.error('Error fetching screening results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch screening results' },
      { status: 500 }
    );
  }
}