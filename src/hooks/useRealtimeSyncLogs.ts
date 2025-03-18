
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SyncLog } from '@/types/syncLog';
import { useToast } from '@/hooks/use-toast';

interface UseSyncLogsOptions {
  mappingId?: string;
  limit?: number;
  includeDetails?: boolean;
}

export function useRealtimeSyncLogs({ 
  mappingId, 
  limit = 20, 
  includeDetails = true 
}: UseSyncLogsOptions = {}) {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed'>('all');
  const { toast } = useToast();

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('gl_sync_logs')
        .select(includeDetails ? `
          *,
          gl_mappings!gl_sync_logs_mapping_id_fkey (
            glide_table,
            glide_table_display_name,
            supabase_table,
            sync_direction,
            gl_connections (
              app_name
            )
          )
        ` : '*')
        .order('started_at', { ascending: false })
        .limit(limit);
      
      if (mappingId) {
        query = query.eq('mapping_id', mappingId);
      }
      
      if (filter === 'completed') {
        query = query.eq('status', 'completed');
      } else if (filter === 'failed') {
        query = query.eq('status', 'failed');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to match the SyncLog type
      const formattedLogs = data.map(log => {
        if (!includeDetails) return log as SyncLog;
        
        const mapping = log.gl_mappings;
        return {
          ...log,
          glide_table: mapping?.glide_table || null,
          glide_table_display_name: mapping?.glide_table_display_name || null,
          supabase_table: mapping?.supabase_table || null,
          app_name: mapping?.gl_connections?.app_name || null,
          sync_direction: mapping?.sync_direction || null
        } as SyncLog;
      });
      
      setSyncLogs(formattedLogs);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch synchronization logs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [mappingId, limit, filter, includeDetails, toast]);

  // Initial load and setup realtime subscription
  useEffect(() => {
    fetchLogs();
    
    let channel;
    if (mappingId) {
      // Subscribe to specific mapping logs
      channel = supabase
        .channel('sync-logs-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'gl_sync_logs', filter: `mapping_id=eq.${mappingId}` },
          fetchLogs
        )
        .subscribe();
    } else {
      // Subscribe to all logs
      channel = supabase
        .channel('all-sync-logs-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'gl_sync_logs' },
          fetchLogs
        )
        .subscribe();
    }
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [mappingId, fetchLogs]);

  return {
    syncLogs,
    isLoading,
    refreshLogs: fetchLogs,
    filter,
    setFilter
  };
}
