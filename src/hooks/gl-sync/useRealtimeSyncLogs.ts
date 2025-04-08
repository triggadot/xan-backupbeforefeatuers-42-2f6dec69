import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SyncLog, SyncLogFilter } from '@/types/syncLog';
import { useToast } from '@/hooks/utils/use-toast';

/**
 * Options for the useRealtimeSyncLogs hook
 * @interface UseSyncLogsOptions
 * @property {string} [mappingId] - Filter logs by mapping ID
 * @property {number} [limit=20] - Maximum number of logs to retrieve
 * @property {boolean} [includeDetails=true] - Whether to include detailed log information
 * @property {boolean} [onlyFailed=false] - Whether to only show failed sync operations
 */
interface UseSyncLogsOptions {
  mappingId?: string;
  limit?: number;
  includeDetails?: boolean;
  onlyFailed?: boolean;
}

/**
 * Hook for fetching and subscribing to sync logs in real-time
 * 
 * @param {UseSyncLogsOptions} options - Configuration options for the hook
 * @returns {Object} Object containing sync logs, loading state, refresh function, filter state, and filter setter
 * 
 * @example
 * ```tsx
 * const { syncLogs, isLoading, refreshLogs, filter, setFilter } = useRealtimeSyncLogs({
 *   limit: 10,
 *   onlyFailed: true
 * });
 * ```
 */
export function useRealtimeSyncLogs({ 
  mappingId, 
  limit = 20, 
  includeDetails = true,
  onlyFailed = false
}: UseSyncLogsOptions = {}): {
  syncLogs: SyncLog[];
  isLoading: boolean;
  refreshLogs: () => Promise<void>;
  filter: SyncLogFilter;
  setFilter: (filter: SyncLogFilter) => void;
} {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<SyncLogFilter>('all');
  const { toast } = useToast();

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Build query based on options
      let query = supabase
        .from('gl_sync_logs')
        .select(includeDetails ? '*' : 'id, created_at, status, mapping_id, direction, record_count')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      // Apply mapping ID filter if provided
      if (mappingId) {
        query = query.eq('mapping_id', mappingId);
      }
      
      // Apply failed filter if requested
      if (onlyFailed) {
        query = query.eq('status', 'error');
      }
      
      // Apply filter based on user selection
      if (filter === 'success') {
        query = query.eq('status', 'success');
      } else if (filter === 'error') {
        query = query.eq('status', 'error');
      } else if (filter === 'running') {
        query = query.eq('status', 'running');
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
      toast({
        title: 'Error fetching sync logs',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [mappingId, limit, includeDetails, onlyFailed, filter, toast]);

  // Initial fetch
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('gl_sync_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gl_sync_logs',
        },
        (payload) => {
          console.log('Sync log change received:', payload);
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs]);

  return {
    syncLogs,
    isLoading,
    refreshLogs: fetchLogs,
    filter,
    setFilter,
  };
}
