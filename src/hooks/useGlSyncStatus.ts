
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlSyncStatus, GlRecentLog, GlSyncStats } from '@/types/glsync';

export function useGlSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<GlSyncStatus[]>([]);
  const [recentLogs, setRecentLogs] = useState<GlRecentLog[]>([]);
  const [syncStats, setSyncStats] = useState<GlSyncStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gl_mapping_status')
        .select('*')
        .order('last_sync_started_at', { ascending: false });
        
      if (error) {
        if (error.code === '42P01') {
          // Table or view might not exist yet
          setSyncStatus([]);
        } else {
          throw error;
        }
      } else {
        setSyncStatus(data as GlSyncStatus[]);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error fetching sync status');
      return [];
    }
  }, []);

  const fetchRecentLogs = useCallback(async (limit: number = 10) => {
    try {
      const { data, error } = await supabase
        .from('gl_recent_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);
        
      if (error) {
        if (error.code === '42P01') {
          // Table or view might not exist yet
          setRecentLogs([]);
        } else {
          throw error;
        }
      } else {
        setRecentLogs(data as GlRecentLog[]);
      }
    } catch (error) {
      console.error('Error fetching recent logs:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error fetching recent logs');
      return [];
    }
  }, []);

  const fetchSyncStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gl_sync_stats')
        .select('*')
        .order('sync_date', { ascending: false })
        .limit(1);
        
      if (error) {
        if (error.code === '42P01') {
          // Table or view might not exist yet
          setSyncStats(null);
        } else {
          throw error;
        }
      } else if (data && data.length > 0) {
        setSyncStats(data[0] as GlSyncStats);
      } else {
        setSyncStats(null);
      }
    } catch (error) {
      console.error('Error fetching sync stats:', error);
      // Don't set global error for stats since it's not critical
      return null;
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);
    
    try {
      await Promise.all([
        fetchSyncStatus(),
        fetchRecentLogs(),
        fetchSyncStats()
      ]);
    } catch (error) {
      console.error('Error in fetchData:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error fetching sync data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchSyncStatus, fetchRecentLogs, fetchSyncStats]);

  // Set up realtime subscription for live updates
  const setupRealtimeSubscription = useCallback(() => {
    const syncLogsChannel = supabase
      .channel('gl_sync_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gl_sync_logs' }, 
        () => {
          // Refresh data when sync logs change
          fetchData();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(syncLogsChannel);
    };
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    
    // Set up realtime subscription
    const cleanup = setupRealtimeSubscription();
    
    // Set up polling for backup when realtime fails
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // Refresh every 30 seconds
    
    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [fetchData, setupRealtimeSubscription]);

  return {
    syncStatus,
    recentLogs,
    syncStats,
    isLoading,
    hasError,
    errorMessage,
    refreshData: fetchData
  };
}
