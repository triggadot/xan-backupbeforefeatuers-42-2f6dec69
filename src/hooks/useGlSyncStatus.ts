
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlSyncStatus, GlRecentLog, GlSyncStats } from '@/types/glsync';
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
      // Use rpc instead of direct table query for the view
      const { data, error } = await supabase
        .rpc('gl_get_sync_status');
      
      if (error) throw error;
      
      // Set all statuses
      setAllSyncStatuses(data as GlSyncStatus[]);
      
      // If mappingId is provided, find and set the specific status
      if (mappingId && data) {
        const statusForMapping = data.find((status: GlSyncStatus) => status.mapping_id === mappingId);
        setSyncStatus(statusForMapping || null);
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
      setRecentLogs(data as GlRecentLog[]);
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
      setSyncStats(data as GlSyncStats[]);
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
      .channel('gl-sync-status-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gl_sync_logs' }, 
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
