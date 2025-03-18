
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlSyncRecord } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';

export function useGlSyncErrors(mappingId?: string) {
  const [syncErrors, setSyncErrors] = useState<GlSyncRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  const fetchSyncErrors = useCallback(async (includeResolved: boolean = false) => {
    if (!mappingId) {
      setSyncErrors([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setHasError(false);
    
    try {
      console.log('Fetching sync errors for mapping ID:', mappingId);
      const { data, error } = await supabase
        .from('gl_sync_errors')
        .select('*')
        .eq('mapping_id', mappingId)
        .is('resolved_at', includeResolved ? null : null);
      
      if (error) {
        console.error('Error fetching sync errors:', error);
        throw new Error(error.message);
      }
      
      const formattedErrors = data ? data.map((record: any) => ({
        id: record.id,
        type: record.error_type as 'VALIDATION_ERROR' | 'TRANSFORM_ERROR' | 'API_ERROR' | 'RATE_LIMIT' | 'NETWORK_ERROR',
        message: record.error_message,
        record: record.record_data,
        timestamp: record.created_at,
        retryable: record.retryable,
        resolved: record.resolved_at !== null,
        resolution_notes: record.resolution_notes
      })) : [];
      
      console.log('Sync errors:', formattedErrors);
      setSyncErrors(formattedErrors);
    } catch (error) {
      console.error('Error fetching sync errors:', error);
      setHasError(true);
      toast({
        title: 'Error fetching sync errors',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [mappingId, toast]);

  const resolveError = useCallback(async (errorId: string, resolutionNotes?: string) => {
    try {
      // Call the RPC function directly
      const { data, error } = await supabase.rpc('gl_resolve_sync_error', { 
        p_error_id: errorId,
        p_resolution_notes: resolutionNotes || null
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data) {
        toast({
          title: 'Error resolved',
          description: 'The sync error has been marked as resolved.',
        });
        
        // Refresh the errors list
        fetchSyncErrors();
        return true;
      } else {
        toast({
          title: 'Error not found',
          description: 'Could not find the specified error.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error resolving sync error:', error);
      toast({
        title: 'Error resolving sync error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchSyncErrors, toast]);

  // Set up realtime subscription for live updates
  const setupRealtimeSubscription = useCallback(() => {
    if (!mappingId) return () => {};
    
    const syncErrorsChannel = supabase
      .channel('gl_error_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gl_sync_errors', filter: `mapping_id=eq.${mappingId}` }, 
        () => {
          // Refresh errors when they change
          fetchSyncErrors();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(syncErrorsChannel);
    };
  }, [fetchSyncErrors, mappingId]);

  useEffect(() => {
    fetchSyncErrors();
    
    // Set up realtime subscription
    const cleanup = setupRealtimeSubscription();
    
    return cleanup;
  }, [fetchSyncErrors, setupRealtimeSubscription]);

  return {
    syncErrors,
    isLoading,
    hasError,
    refreshErrors: fetchSyncErrors,
    resolveError
  };
}
