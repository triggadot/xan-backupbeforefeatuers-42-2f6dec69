
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SyncLog, SyncLogFilter } from '@/types/syncLog';

interface SyncLogsHookResult {
  logs: SyncLog[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  filterLogs: (filter: SyncLogFilter) => void;
  currentFilter: SyncLogFilter;
}

export function useRealtimeSyncLogs(
  mappingId?: string,
  limit: number = 10,
  initialFilter?: SyncLogFilter
): SyncLogsHookResult {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<SyncLogFilter>(
    initialFilter || { mappingId }
  );
  const { toast } = useToast();

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('gl_sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      // Apply filters if any
      if (currentFilter) {
        if (currentFilter.mappingId) {
          query = query.eq('mapping_id', currentFilter.mappingId);
        }
        
        if (currentFilter.status === 'completed') {
          query = query.eq('status', 'completed');
        } else if (currentFilter.status === 'failed') {
          query = query.eq('status', 'failed');
        }
        
        if (currentFilter.fromDate) {
          query = query.gte('started_at', currentFilter.fromDate.toISOString());
        }
        
        if (currentFilter.toDate) {
          query = query.lte('started_at', currentFilter.toDate.toISOString());
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Get mapping details for each log
      const logsWithDetails = await Promise.all((data || []).map(async (log) => {
        try {
          const { data: mapping } = await supabase
            .from('gl_mappings')
            .select('glide_table, glide_table_display_name, supabase_table, sync_direction')
            .eq('id', log.mapping_id)
            .single();

          return {
            ...log,
            ...mapping
          } as SyncLog;
        } catch (error) {
          console.error('Error fetching mapping details:', error);
          return log as SyncLog;
        }
      }));

      setLogs(logsWithDetails);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      console.error('Error fetching sync logs:', error);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentFilter, limit, toast]);

  // Filter logs function
  const filterLogs = useCallback((filter: SyncLogFilter) => {
    setCurrentFilter(filter);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('gl_sync_logs_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'gl_sync_logs',
      }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs]);

  return {
    logs,
    isLoading,
    error,
    refetch: fetchLogs,
    filterLogs,
    currentFilter,
  };
}
