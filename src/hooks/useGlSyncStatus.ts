
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlSyncStatus } from '@/types/glsync';

export function useGlSyncStatus() {
  const [status, setStatus] = useState<GlSyncStatus | null>(null);
  const [allStatuses, setAllStatuses] = useState<GlSyncStatus[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchSyncStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch the most recent active mapping status
      const { data: statusData, error: statusError } = await supabase
        .from('gl_mapping_status')
        .select('*')
        .order('last_sync_started_at', { ascending: false })
        .limit(1);

      if (statusError) throw statusError;

      // Fetch all mappings for the dashboard
      const { data: allStatusesData, error: allStatusesError } = await supabase
        .from('gl_mapping_status')
        .select('*')
        .order('enabled', { ascending: false });

      if (allStatusesError) throw allStatusesError;

      // Convert data to GlSyncStatus format
      if (statusData && statusData.length > 0) {
        // Cast the database result to GlSyncStatus
        const typedStatus = statusData[0] as unknown as GlSyncStatus;
        setStatus(typedStatus);
      } else {
        setStatus(null);
      }

      if (allStatusesData) {
        // Cast each item in the array to GlSyncStatus
        const typedStatuses = allStatusesData.map(status => status as unknown as GlSyncStatus);
        setAllStatuses(typedStatuses);
      } else {
        setAllStatuses([]);
      }
    } catch (err) {
      console.error('Error fetching sync status:', err);
      setError(err instanceof Error ? err.message : 'An error occurred fetching sync status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setupRealtimeSubscription = useCallback(() => {
    const channel = supabase
      .channel('gl_mapping_status_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gl_mapping_status',
        },
        () => {
          fetchSyncStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSyncStatus]);

  useEffect(() => {
    fetchSyncStatus();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [fetchSyncStatus, setupRealtimeSubscription]);

  const refetch = useCallback(async () => {
    await fetchSyncStatus();
  }, [fetchSyncStatus]);

  return { status, allStatuses, isLoading, error, refetch };
}
