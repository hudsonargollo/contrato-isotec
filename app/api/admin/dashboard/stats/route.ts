/**
 * Admin Dashboard Statistics API
 * GET /api/admin/dashboard/stats - Get contract statistics for dashboard
 * 
 * Requirements: 7.2, 7.6
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/dashboard/stats
 * Get contract statistics for admin dashboard
 * Validates: Requirements 7.2, 7.6
 */
export async function GET() {
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

    // Get contract statistics
    const [
      totalContractsResult,
      signedContractsResult,
      pendingContractsResult,
      activeClientsResult
    ] = await Promise.all([
      // Total contracts
      supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true }),
      
      // Signed contracts
      supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'signed'),
      
      // Pending signature contracts
      supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_signature'),
      
      // Active clients (unique contractors with signed contracts)
      supabase
        .from('contracts')
        .select('contractor_cpf', { count: 'exact', head: true })
        .eq('status', 'signed')
    ]);

    // Check for errors
    if (totalContractsResult.error) {
      console.error('Error fetching total contracts:', totalContractsResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch contract statistics' },
        { status: 500 }
      );
    }

    if (signedContractsResult.error) {
      console.error('Error fetching signed contracts:', signedContractsResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch contract statistics' },
        { status: 500 }
      );
    }

    if (pendingContractsResult.error) {
      console.error('Error fetching pending contracts:', pendingContractsResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch contract statistics' },
        { status: 500 }
      );
    }

    if (activeClientsResult.error) {
      console.error('Error fetching active clients:', activeClientsResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch contract statistics' },
        { status: 500 }
      );
    }

    // Return statistics
    return NextResponse.json({
      success: true,
      statistics: {
        totalContracts: totalContractsResult.count || 0,
        signedContracts: signedContractsResult.count || 0,
        pendingSignature: pendingContractsResult.count || 0,
        activeClients: activeClientsResult.count || 0
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/dashboard/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}