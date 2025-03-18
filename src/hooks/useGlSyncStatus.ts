
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlSyncStatus } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';

export function useGlSyncStatus(mappingId?: string) {
  const [syncStatus, setSyncStatus] = useState<GlSyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  const fetchSyncStatus = useCallback(async (): Promise<void> => {
    if (!mappingId) {
      setSyncStatus(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setHasError(false);
    
    try {
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
    } catch (error) {
      console.error('Error fetching sync status:', error);
      setHasError(true);
      toast({
        title: 'Error fetching sync status',
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
    
    // Subscribe to changes on the mapping_status view
    const syncStatusChannel = supabase
      .channel('gl_status_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gl_mapping_status', filter: `mapping_id=eq.${mappingId}` }, 
        () => {
          // Refresh status when it changes
          fetchSyncStatus();
        }
      )
      .subscribe();
    
    // Also subscribe to sync logs which can affect status
    const syncLogsChannel = supabase
      .channel('gl_log_changes_for_status')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'gl_sync_logs', filter: `mapping_id=eq.${mappingId}` }, 
        () => {
          // Refresh status when new logs are added
          fetchSyncStatus();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(syncStatusChannel);
      supabase.removeChannel(syncLogsChannel);
    };
  }, [fetchSyncStatus, mappingId]);

  useEffect(() => {
    fetchSyncStatus();
    
    // Set up realtime subscription
    const cleanup = setupRealtimeSubscription();
    
    return cleanup;
  }, [fetchSyncStatus, setupRealtimeSubscription]);

  return {
    syncStatus,
    isLoading,
    hasError,
    refreshStatus: fetchSyncStatus
  };
}
