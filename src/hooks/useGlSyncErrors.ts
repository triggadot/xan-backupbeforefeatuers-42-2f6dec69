
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlSyncRecord } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';

export function useGlSyncErrors(mappingId?: string) {
  const [syncErrors, setSyncErrors] = useState<GlSyncRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchErrors = useCallback(async () => {
    if (!mappingId) {
      setSyncErrors([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('gl_get_sync_errors', { p_mapping_id: mappingId });
      
      if (error) throw new Error(error.message);
      
      setSyncErrors(data || []);
    } catch (error) {
      console.error('Error fetching sync errors:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch synchronization errors',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [mappingId, toast]);

  const resolveError = useCallback(async (errorId: string, notes?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('gl_resolve_sync_error', { 
          p_error_id: errorId,
          p_resolution_notes: notes || null
        });
      
      if (error) throw new Error(error.message);
      
      // Refresh errors after resolution
      fetchErrors();
      
      toast({
        title: 'Error resolved',
        description: 'The error has been marked as resolved',
      });
      
      return true;
    } catch (error) {
      console.error('Error resolving sync error:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve the error',
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchErrors, toast]);

  // Initial load and setup realtime subscription
  useEffect(() => {
    fetchErrors();
    
    if (mappingId) {
      // Subscribe to real-time changes in sync errors
      const channel = supabase
        .channel('sync-errors-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'gl_sync_errors', filter: `mapping_id=eq.${mappingId}` },
          fetchErrors
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [mappingId, fetchErrors]);

  return {
    syncErrors,
    isLoading,
    refreshErrors: fetchErrors,
    resolveError
  };
}
