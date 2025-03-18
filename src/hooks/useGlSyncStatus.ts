
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlSyncStatus, GlRecentLog, GlSyncStats, GlSyncStatuses } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';

export function useGlSyncStatus(mappingId?: string) {
  const [syncStatus, setSyncStatus] = useState<GlSyncStatus | null>(null);
  const [allSyncStatuses, setAllSyncStatuses] = useState<GlSyncStatuses>([]);
  const [recentLogs, setRecentLogs] = useState<GlRecentLog[]>([]);
  const [syncStats, setSyncStats] = useState<GlSyncStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSyncStatus = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      if (mappingId) {
        // For a specific mapping
        console.log('Fetching sync status for mapping ID:', mappingId);
        const { data, error } = await supabase
          .from('gl_mapping_status')
          .select('*')
          .eq('mapping_id', mappingId)
          .single();
        
        if (error) {
          // If no data found, don't treat as error, just return null
          if (error.code === 'PGRST116') {
            setSyncStatus(null);
            setIsLoading(false);
            return;
          }
          console.error('Error fetching sync status:', error);
          throw new Error(error.message);
        }
        
        setSyncStatus(data);
      } else {
        // For all mappings
        const { data, error } = await supabase
          .from('gl_mapping_status')
          .select('*')
          .order('last_sync_started_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching all sync statuses:', error);
          throw new Error(error.message);
        }
        
        setAllSyncStatuses(data || []);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: 'Error fetching sync status',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [mappingId, toast]);

  const fetchRecentLogs = useCallback(async (): Promise<void> => {
    try {
      if (mappingId) {
        // Fetch recent logs for a specific mapping
        const { data, error } = await supabase
          .from('gl_sync_logs')
          .select('*')
          .eq('mapping_id', mappingId)
          .order('started_at', { ascending: false })
          .limit(5);
        
        if (error) throw new Error(error.message);
        
        // Convert the logs to GlRecentLog format
        const formattedLogs: GlRecentLog[] = (data || []).map(log => {
          // If we have a specific mapping ID, get the mapping info to fill in the GlRecentLog fields
          return {
            id: log.id,
            status: log.status,
            message: log.message,
            records_processed: log.records_processed,
            started_at: log.started_at,
            glide_table: syncStatus?.glide_table || null,
            glide_table_display_name: syncStatus?.glide_table_display_name || null,
            supabase_table: syncStatus?.supabase_table || null,
            app_name: syncStatus?.app_name || null,
            sync_direction: syncStatus?.sync_direction || null
          };
        });
        
        setRecentLogs(formattedLogs);
      } else {
        // Fetch global recent logs
        const { data, error } = await supabase
          .from('gl_recent_logs')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(10);
        
        if (error) throw new Error(error.message);
        setRecentLogs(data || []);
      }
    } catch (error) {
      console.error('Error fetching recent logs:', error);
      toast({
        title: 'Error fetching recent logs',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [mappingId, syncStatus, toast]);

  const fetchSyncStats = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('gl_sync_stats')
        .select('*')
        .order('sync_date', { ascending: false })
        .limit(7);
      
      if (error) throw new Error(error.message);
      setSyncStats(data || []);
    } catch (error) {
      console.error('Error fetching sync stats:', error);
      // Don't show a toast for stats errors - less critical
    }
  }, []);

  const refreshData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    await Promise.all([
      fetchSyncStatus(),
      fetchRecentLogs(),
      fetchSyncStats()
    ]);
    setIsLoading(false);
  }, [fetchSyncStatus, fetchRecentLogs, fetchSyncStats]);

  // Set up realtime subscription for sync status changes
  useEffect(() => {
    fetchSyncStatus();
    fetchRecentLogs();
    fetchSyncStats();
    
    // Set up realtime subscriptions if we have a mapping ID
    if (mappingId) {
      // Subscribe to changes in the mapping status view
      const statusChannel = supabase
        .channel('gl_status_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'gl_mapping_status', filter: `mapping_id=eq.${mappingId}` }, 
          () => {
            fetchSyncStatus();
          }
        )
        .subscribe();
      
      // Subscribe to changes in the sync logs table
      const logsChannel = supabase
        .channel('gl_logs_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'gl_sync_logs', filter: `mapping_id=eq.${mappingId}` }, 
          () => {
            fetchRecentLogs();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(statusChannel);
        supabase.removeChannel(logsChannel);
      };
    } else {
      // Subscribe to global changes in the recent logs view
      const globalLogsChannel = supabase
        .channel('gl_global_logs_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'gl_sync_logs' }, 
          () => {
            fetchRecentLogs();
            fetchSyncStats();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(globalLogsChannel);
      };
    }
  }, [mappingId, fetchSyncStatus, fetchRecentLogs, fetchSyncStats]);

  return {
    syncStatus,
    syncStats,
    recentLogs,
    isLoading,
    hasError,
    errorMessage,
    refreshData,
    // Return the array of statuses when no specific mappingId is provided
    allSyncStatuses
  };
}
