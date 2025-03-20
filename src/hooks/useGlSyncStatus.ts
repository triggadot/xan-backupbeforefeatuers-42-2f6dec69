
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
<<<<<<< Updated upstream
      setIsLoading(true);
      setError('');

      // Fetch the most recent active mapping status
      const { data: statusData, error: statusError } = await supabase
        .from('gl_mapping_status')
=======
      // If mappingId is provided, fetch specific status
      if (mappingId) {
        const { data, error } = await supabase
          .from('gl_mapping_status')
          .select('*')
          .eq('mapping_id', mappingId)
          .single();
        
        if (error) throw error;
        
        // Convert database record to GlSyncStatus
        const syncStatus: GlSyncStatus = {
          id: data.mapping_id,
          status: data.current_status || 'pending',
          mapping_id: data.mapping_id,
          connection_id: data.connection_id,
          glide_table: data.glide_table,
          glide_table_display_name: data.glide_table_display_name,
          supabase_table: data.supabase_table,
          column_mappings: data.column_mappings as unknown as Record<string, GlColumnMapping>,
          sync_direction: data.sync_direction,
          enabled: data.enabled,
          app_name: data.app_name,
          last_sync_started_at: data.last_sync_started_at,
          last_sync_completed_at: data.last_sync_completed_at,
          records_processed: data.records_processed,
          total_records: data.total_records,
          error_count: data.error_count,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        
        setStatus(syncStatus);
      } 
      // Otherwise fetch all statuses
      else {
        const { data, error } = await supabase
          .from('gl_mapping_status')
          .select('*')
          .order('last_sync_started_at', { ascending: false });
        
        if (error) throw error;
        
        // Convert database records to GlSyncStatus[]
        const statuses: GlSyncStatus[] = (data || []).map(item => ({
          id: item.mapping_id,
          status: item.current_status || 'pending',
          mapping_id: item.mapping_id,
          connection_id: item.connection_id,
          glide_table: item.glide_table,
          glide_table_display_name: item.glide_table_display_name,
          supabase_table: item.supabase_table,
          column_mappings: item.column_mappings as unknown as Record<string, GlColumnMapping>,
          sync_direction: item.sync_direction,
          enabled: item.enabled,
          app_name: item.app_name,
          last_sync_started_at: item.last_sync_started_at,
          last_sync_completed_at: item.last_sync_completed_at,
          records_processed: item.records_processed,
          total_records: item.total_records,
          error_count: item.error_count,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));
        
        setAllSyncStatuses(statuses);
      }
      
      // Fetch recent logs
      const { data: logsData, error: logsError } = await supabase
        .from('gl_recent_logs')
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
  return {
    status,
    allStatuses: allSyncStatuses,
    recentLogs,
    syncStats,
    isLoading,
    error,
    hasError,
    errorMessage,
    refetch: fetchSyncStatus,
    refreshData
  };
};
>>>>>>> Stashed changes
