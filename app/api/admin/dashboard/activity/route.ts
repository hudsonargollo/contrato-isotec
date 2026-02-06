/**
 * Admin Dashboard Recent Activity API
 * GET /api/admin/dashboard/activity - Get recent contract activity for dashboard
 * 
 * Requirements: 7.2, 7.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/dashboard/activity
 * Get recent contract activity for admin dashboard
 * Validates: Requirements 7.2, 7.6
 */
export async function GET(request: NextRequest) {
  try {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get recent contracts (last 10 by default)
    const { data: recentContracts, error: contractsError } = await supabase
      .from('contracts')
      .select(`
        id,
        uuid,
        contractor_name,
        status,
        contract_value,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 50)); // Cap at 50 for performance

    if (contractsError) {
      console.error('Error fetching recent contracts:', contractsError);
      return NextResponse.json(
        { error: 'Failed to fetch recent activity' },
        { status: 500 }
      );
    }

    // Transform contracts into activity items
    const activities = (recentContracts || []).map(contract => ({
      id: contract.id,
      type: 'contract_created',
      title: `Novo contrato criado`,
      description: `Contrato para ${contract.contractor_name}`,
      contractUuid: contract.uuid,
      contractorName: contract.contractor_name,
      status: contract.status,
      contractValue: contract.contract_value,
      timestamp: contract.created_at,
      metadata: {
        contractId: contract.id,
        contractUuid: contract.uuid,
        status: contract.status
      }
    }));

    // Return recent activity
    return NextResponse.json({
      success: true,
      activities,
      pagination: {
        limit,
        total: activities.length
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/dashboard/activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}