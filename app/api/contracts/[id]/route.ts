/**
 * Contract Detail API Route
 * GET /api/contracts/[id] - Get contract by ID with items and audit logs
 * 
 * Requirements: 9.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/contracts/[id]
 * Fetch contract details with items and audit logs
 * Validates: Requirements 9.5
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get Supabase client
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Fetch contract with items
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*, contract_items(*)')
      .eq('id', id)
      .single();

    if (contractError) {
      if (contractError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Contract not found' },
          { status: 404 }
        );
      }
      
      console.error('Contract fetch error:', contractError);
      return NextResponse.json(
        { error: 'Failed to fetch contract', details: contractError.message },
        { status: 500 }
      );
    }

    // Fetch audit logs
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('contract_id', id)
      .order('created_at', { ascending: false });

    if (auditError) {
      console.error('Audit logs fetch error:', auditError);
      // Don't fail the request if audit logs can't be fetched
    }

    // Return contract with items and audit logs
    return NextResponse.json({
      success: true,
      contract: {
        ...contract,
        auditLogs: auditLogs || []
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/contracts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
