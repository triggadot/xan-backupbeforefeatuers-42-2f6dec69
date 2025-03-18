
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SyncLog } from '@/types/syncLog';
import { useToast } from '@/hooks/use-toast';

export function useGlSyncLogs(mappingId?: string, limit: number = 10) {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('gl_sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);
      
      if (mappingId) {
        query = query.eq('mapping_id', mappingId);
      }
      
      const { data, error } = await query;
      
      if (error) throw new Error(error.message);
      setSyncLogs(data || []);
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
  }, [mappingId, limit, toast]);

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
    refreshLogs: fetchLogs
  };
}
