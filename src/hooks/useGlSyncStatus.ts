import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  GlSyncStatus, 
  GlRecentLog, 
  GlSyncStats, 
  convertDbToGlRecentLog,
  convertDbToGlSyncStats
} from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';

export function useGlSyncStatus(mappingId?: string) {
  const [syncStatus, setSyncStatus] = useState<GlSyncStatus | null>(null);
  const [allSyncStatuses, setAllSyncStatuses] = useState<GlSyncStatus[]>([]);
  const [recentLogs, setRecentLogs] = useState<GlRecentLog[]>([]);
  const [syncStats, setSyncStats] = useState<GlSyncStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSyncStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_mapping_status')
        .select('*')
        .order('last_sync_started_at', { ascending: false });
      
      if (error) throw error;
      
      // Set all statuses - ensure we properly type the statuses
      setAllSyncStatuses(data.map(item => ({
        mapping_id: item.mapping_id,
        current_status: (item.current_status || 'idle') as GlSyncStatus['current_status'],
        last_sync_completed_at: item.last_sync_completed_at,
        total_records: item.total_records,
        records_processed: item.records_processed,
        error_count: item.error_count,
        connection_id: item.connection_id,
        app_name: item.app_name,
        glide_table: item.glide_table,
        glide_table_display_name: item.glide_table_display_name,
        supabase_table: item.supabase_table,
        enabled: item.enabled
      })));
      
      // If mappingId is provided, find and set the specific status
      if (mappingId) {
        const statusForMapping = data.find(status => status.mapping_id === mappingId);
        if (statusForMapping) {
          setSyncStatus({
            mapping_id: statusForMapping.mapping_id,
            current_status: (statusForMapping.current_status || 'idle') as GlSyncStatus['current_status'],
            last_sync_completed_at: statusForMapping.last_sync_completed_at,
            total_records: statusForMapping.total_records,
            records_processed: statusForMapping.records_processed,
            error_count: statusForMapping.error_count,
            connection_id: statusForMapping.connection_id,
            app_name: statusForMapping.app_name,
            glide_table: statusForMapping.glide_table,
            glide_table_display_name: statusForMapping.glide_table_display_name,
            supabase_table: statusForMapping.supabase_table,
            enabled: statusForMapping.enabled
          });
        } else {
          setSyncStatus(null);
        }
      } else {
        setSyncStatus(null);
      }

      // Reset error state on successful fetch
      setHasError(false);
      setErrorMessage(null);
    } catch (error) {
      console.error('Error fetching sync status:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      toast({
        title: 'Error',
        description: 'Failed to fetch synchronization status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [mappingId, toast]);

  const fetchRecentLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gl_recent_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      // Convert database results to proper types
      setRecentLogs((data || []).map(item => convertDbToGlRecentLog(item)));
    } catch (error) {
      console.error('Error fetching recent logs:', error);
    }
  }, []);

  const fetchSyncStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gl_sync_stats')
        .select('*')
        .order('sync_date', { ascending: false })
        .limit(7);
      
      if (error) throw error;
      
      // Convert database results to proper types
      setSyncStats((data || []).map(item => convertDbToGlSyncStats(item)));
    } catch (error) {
      console.error('Error fetching sync stats:', error);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchSyncStatus(),
      fetchRecentLogs(),
      fetchSyncStats()
    ]);
  }, [fetchSyncStatus, fetchRecentLogs, fetchSyncStats]);

  useEffect(() => {
    refreshData();
    
    // Set up a realtime subscription for sync status updates
    const channel = supabase
      .channel('gl-mapping-status-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gl_mapping_status' }, 
        () => refreshData()
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [mappingId, refreshData]);

  return {
    syncStatus,
    allSyncStatuses,
    recentLogs,
    syncStats,
    isLoading,
    hasError,
    errorMessage,
    refreshStatus: fetchSyncStatus,
    refreshData
  };
}
