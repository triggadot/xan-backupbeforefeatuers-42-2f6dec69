
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlSyncLog } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';

export function useGlSyncLogs(mappingId?: string) {
  const [syncLogs, setSyncLogs] = useState<GlSyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  const fetchSyncLogs = useCallback(async (includeResolved: boolean = false): Promise<void> => {
    if (!mappingId) {
      setSyncLogs([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setHasError(false);
    
    try {
      console.log('Fetching sync logs for mapping ID:', mappingId);
      const { data, error } = await supabase
        .from('gl_sync_logs')
        .select('*')
        .eq('mapping_id', mappingId)
        .order('started_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error fetching sync logs:', error);
        throw new Error(error.message);
      }
      
      const typedLogs: GlSyncLog[] = (data || []).map(log => ({
        id: log.id,
        mapping_id: log.mapping_id,
        started_at: log.started_at,
        completed_at: log.completed_at,
        status: log.status as "started" | "processing" | "completed" | "failed",
        message: log.message,
        records_processed: log.records_processed
      }));
      
      setSyncLogs(typedLogs);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
      setHasError(true);
      toast({
        title: 'Error fetching sync logs',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [mappingId, toast]);

  // Set up realtime subscription for live updates
  const setupRealtimeSubscription = useCallback(() => {
    if (!mappingId) return () => {};
    
    const syncLogsChannel = supabase
      .channel('gl_log_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gl_sync_logs', filter: `mapping_id=eq.${mappingId}` }, 
        () => {
          // Refresh logs when they change
          fetchSyncLogs();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(syncLogsChannel);
    };
  }, [fetchSyncLogs, mappingId]);

  useEffect(() => {
    fetchSyncLogs();
    
    // Set up realtime subscription
    const cleanup = setupRealtimeSubscription();
    
    return cleanup;
  }, [fetchSyncLogs, setupRealtimeSubscription]);

  return {
    syncLogs,
    isLoading,
    hasError,
    refreshLogs: fetchSyncLogs
  };
}
