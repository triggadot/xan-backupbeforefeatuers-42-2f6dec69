
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SyncLog } from '@/types/syncLog';
import { useToast } from '@/hooks/use-toast';

interface UseSyncLogsOptions {
  mappingId?: string;
  limit?: number;
  includeDetails?: boolean;
  onlyFailed?: boolean;
}

export function useRealtimeSyncLogs({ 
  mappingId, 
  limit = 20, 
  includeDetails = true,
  onlyFailed = false
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
        .select(`
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
        `)
        .order('started_at', { ascending: false })
        .limit(limit);
      
      if (mappingId) {
        query = query.eq('mapping_id', mappingId);
      }
      
      if (onlyFailed) {
        query = query.eq('status', 'failed');
      }
      
      if (filter !== 'all') {
        if (filter === 'completed') {
          query = query.eq('status', 'completed');
        } else if (filter === 'failed') {
          query = query.eq('status', 'failed');
        }
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Safely validate and transform the response data
      const formattedLogs = (data || []).map(log => {
        // Create a base log object with required properties
        const baseLog: SyncLog = {
          id: log.id || '',
          mapping_id: log.mapping_id || null,
          started_at: log.started_at || '',
          completed_at: log.completed_at || null,
          status: log.status || '',
          message: log.message || null,
          records_processed: log.records_processed || null
        };
        
        // If we don't need details, return just the base log
        if (!includeDetails) return baseLog;
        
        // If we have mapping details, add them
        const mappingData = log.gl_mappings || null;
        
        return {
          ...baseLog,
          glide_table: mappingData?.glide_table || null,
          glide_table_display_name: mappingData?.glide_table_display_name || null,
          supabase_table: mappingData?.supabase_table || null,
          app_name: mappingData?.gl_connections?.app_name || null,
          sync_direction: mappingData?.sync_direction || null
        };
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
  }, [mappingId, limit, includeDetails, onlyFailed, filter, toast]);

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
