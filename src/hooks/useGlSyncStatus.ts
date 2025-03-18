
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlSyncStatus, GlRecentLog } from '@/types/glsync';

export function useGlSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<GlSyncStatus[]>([]);
  const [recentLogs, setRecentLogs] = useState<GlRecentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gl_mapping_status')
        .select('*')
        .order('last_sync_started_at', { ascending: false });
        
      if (error) {
        if (error.code === '42P01') {
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
      return [];
    }
  }, []);

  const fetchRecentLogs = useCallback(async (limit: number = 5) => {
    try {
      const { data, error } = await supabase
        .from('gl_recent_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);
        
      if (error) {
        if (error.code === '42P01') {
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
      return [];
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      await Promise.all([
        fetchSyncStatus(),
        fetchRecentLogs()
      ]);
    } catch (error) {
      console.error('Error in fetchData:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSyncStatus, fetchRecentLogs]);

  useEffect(() => {
    fetchData();
    
    // Set up polling for live updates
    const interval = setInterval(() => {
      fetchData();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    syncStatus,
    recentLogs,
    isLoading,
    hasError,
    refreshData: fetchData
  };
}
