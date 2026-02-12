/**
 * Dashboard Statistics Hook
 * Custom hook for fetching admin dashboard statistics
 * 
 * Requirements: 7.2, 7.6
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DashboardStats {
  totalContracts: number;
  signedContracts: number;
  pendingSignature: number;
  activeClients: number;
}

interface UseDashboardStatsReturn {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setStats({
          totalContracts: 0,
          signedContracts: 0,
          pendingSignature: 0,
          activeClients: 0
        });
        return;
      }

      // Get contract statistics directly from Supabase
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

      setStats({
        totalContracts: totalContractsResult.count || 0,
        signedContracts: signedContractsResult.count || 0,
        pendingSignature: pendingContractsResult.count || 0,
        activeClients: activeClientsResult.count || 0
      });

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      // Set default stats on error
      setStats({
        totalContracts: 0,
        signedContracts: 0,
        pendingSignature: 0,
        activeClients: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}