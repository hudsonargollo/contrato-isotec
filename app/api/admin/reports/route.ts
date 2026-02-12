/**
 * Admin Reports API Route
 * 
 * Provides analytics and reporting data for the admin panel
 * Calculates metrics from contracts and other system data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get all contracts
    const { data: allContracts, error: allContractsError } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (allContractsError) {
      console.error('Database error:', allContractsError);
      return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
    }

    // Get contracts within the specified period
    const { data: periodContracts, error: periodError } = await supabase
      .from('contracts')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (periodError) {
      console.error('Database error:', periodError);
      return NextResponse.json({ error: 'Failed to fetch period contracts' }, { status: 500 });
    }

    // Calculate metrics
    const totalContracts = allContracts?.length || 0;
    const totalRevenue = allContracts?.reduce((sum, contract) => sum + (contract.contract_value || 0), 0) || 0;
    const averageContractValue = totalContracts > 0 ? totalRevenue / totalContracts : 0;

    const contractsThisMonth = periodContracts?.length || 0;
    const revenueThisMonth = periodContracts?.reduce((sum, contract) => sum + (contract.contract_value || 0), 0) || 0;

    // Calculate conversion rate (signed contracts / total contracts)
    const signedContracts = allContracts?.filter(c => c.status === 'signed').length || 0;
    const conversionRate = totalContracts > 0 ? (signedContracts / totalContracts) * 100 : 0;

    // Generate monthly data for the last 3 months
    const monthlyData = [];
    for (let i = 2; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthContracts = allContracts?.filter(contract => {
        const contractDate = new Date(contract.created_at);
        return contractDate >= monthStart && contractDate <= monthEnd;
      }) || [];

      const monthRevenue = monthContracts.reduce((sum, contract) => sum + (contract.contract_value || 0), 0);

      monthlyData.push({
        month: monthStart.toLocaleDateString('pt-BR', { month: 'short' }),
        contracts: monthContracts.length,
        revenue: monthRevenue
      });
    }

    // Status breakdown
    const statusCounts = {
      signed: allContracts?.filter(c => c.status === 'signed').length || 0,
      pending_signature: allContracts?.filter(c => c.status === 'pending_signature').length || 0,
      cancelled: allContracts?.filter(c => c.status === 'cancelled').length || 0
    };

    const statusBreakdown = [
      {
        status: 'Assinados',
        count: statusCounts.signed,
        percentage: totalContracts > 0 ? Math.round((statusCounts.signed / totalContracts) * 100 * 10) / 10 : 0
      },
      {
        status: 'Pendentes',
        count: statusCounts.pending_signature,
        percentage: totalContracts > 0 ? Math.round((statusCounts.pending_signature / totalContracts) * 100 * 10) / 10 : 0
      },
      {
        status: 'Cancelados',
        count: statusCounts.cancelled,
        percentage: totalContracts > 0 ? Math.round((statusCounts.cancelled / totalContracts) * 100 * 10) / 10 : 0
      }
    ];

    const reportData = {
      totalContracts,
      totalRevenue,
      averageContractValue,
      contractsThisMonth,
      revenueThisMonth,
      conversionRate: Math.round(conversionRate * 10) / 10,
      monthlyData,
      statusBreakdown
    };

    return NextResponse.json(reportData);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}