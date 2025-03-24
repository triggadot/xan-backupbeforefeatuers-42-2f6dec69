import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlSyncRecord } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';

export function useGlSyncErrors(mappingId: string) {
  const [syncErrors, setSyncErrors] = useState<GlSyncRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSyncErrors = useCallback(async (includeResolved: boolean = false) => {
    if (!mappingId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('gl_get_sync_errors', { 
          p_mapping_id: mappingId, 
          p_limit: 100,
          p_include_resolved: includeResolved
        });
      
      if (error) throw error;
      
      // Transform the data to match the GlSyncRecord type
      const formattedErrors = (data || []).map((item: any) => ({
        id: item.id,
        mapping_id: item.mapping_id,
        type: item.error_type,
        message: item.error_message,
        record: item.record_data,
        timestamp: item.created_at,
        retryable: item.retryable,
        resolved: item.resolved_at !== null,
        resolution_notes: item.resolution_notes,
        created_at: item.created_at,
        resolved_at: item.resolved_at
      })) as GlSyncRecord[];
      
      setSyncErrors(formattedErrors);
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

  const resolveError = useCallback(async (errorId: string, notes?: string) => {
    try {
      const { data, error } = await supabase
        .rpc('gl_resolve_sync_error', { 
          p_error_id: errorId,
          p_resolution_notes: notes
        });
      
      if (error) throw error;
      
      // Refresh the errors list
      await fetchSyncErrors();
      
      toast({
        title: 'Success',
        description: 'Error marked as resolved',
      });
      
      return true;
    } catch (error) {
      console.error('Error resolving sync error:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve error',
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchSyncErrors, toast]);

  // Fetch errors on hook initialization
  useEffect(() => {
    if (mappingId) {
      fetchSyncErrors();
    }
  }, [mappingId, fetchSyncErrors]);

  return {
    syncErrors,
    isLoading,
    fetchSyncErrors,
    resolveError
  };
}
