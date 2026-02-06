/**
 * Dashboard Activity Hook
 * Custom hook for fetching admin dashboard recent activity
 * 
 * Requirements: 7.2, 7.6
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

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

      const response = await fetch(`/api/admin/dashboard/activity?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch activity: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch activity');
      }

      setActivities(data.activities || []);
    } catch (err) {
      console.error('Error fetching dashboard activity:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
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