/**
 * Dashboard Activity Hook
 * Custom hook for fetching admin dashboard recent activity
 * 
 * Requirements: 7.2, 7.6
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  contractUuid: string;
  contractorName: string;
  status: 'pending_signature' | 'signed' | 'cancelled';
  contractValue: number;
  timestamp: string;
  metadata: {
    contractId: string;
    contractUuid: string;
    status: string;
  };
}

interface UseDashboardActivityReturn {
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardActivity(limit: number = 10): UseDashboardActivityReturn {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setActivities([]);
        return;
      }

      // Get recent contracts directly from Supabase
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
        setActivities([]);
        return;
      }

      // Transform contracts into activity items
      const activityItems = (recentContracts || []).map(contract => ({
        id: contract.id,
        type: 'contract_created',
        title: `Novo contrato criado`,
        description: `Contrato para ${contract.contractor_name}`,
        contractUuid: contract.uuid,
        contractorName: contract.contractor_name,
        status: contract.status as 'pending_signature' | 'signed' | 'cancelled',
        contractValue: contract.contract_value || 0,
        timestamp: contract.created_at,
        metadata: {
          contractId: contract.id,
          contractUuid: contract.uuid,
          status: contract.status
        }
      }));

      setActivities(activityItems);

    } catch (err) {
      console.error('Error fetching dashboard activity:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivity
  };
}