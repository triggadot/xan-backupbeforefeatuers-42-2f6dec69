
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlSyncRecord } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';

export function useGlSyncErrors(mappingId?: string) {
  const [syncErrors, setSyncErrors] = useState<GlSyncRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [includeResolved, setIncludeResolved] = useState(false);
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
        .rpc('gl_get_sync_errors', { 
          p_mapping_id: mappingId,
          p_limit: 100,
          p_include_resolved: includeResolved
        });

      if (error) throw error;

      // Transform data to match GlSyncRecord type
      const formattedErrors = data.map((error: any) => ({
        id: error.id,
        mapping_id: error.mapping_id,
        type: error.error_type as 'VALIDATION_ERROR' | 'TRANSFORM_ERROR' | 'API_ERROR' | 'RATE_LIMIT' | 'NETWORK_ERROR',
        message: error.error_message,
        record: error.record_data,
        timestamp: error.created_at,
        retryable: error.retryable,
        resolved: error.resolved_at !== null,
        resolution_notes: error.resolution_notes,
        created_at: error.created_at,
        error_type: error.error_type,
        error_message: error.error_message,
        record_data: error.record_data,
        resolved_at: error.resolved_at
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
  }, [mappingId, includeResolved, toast]);

  useEffect(() => {
    fetchErrors();

    // Subscribe to changes in the gl_sync_errors table
    const channel = supabase
      .channel('gl-sync-errors-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'gl_sync_errors',
          filter: mappingId ? `mapping_id=eq.${mappingId}` : undefined
        }, 
        fetchErrors
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mappingId, fetchErrors]);

  const resolveError = async (errorId: string, notes?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('gl_resolve_sync_error', {
          p_error_id: errorId,
          p_resolution_notes: notes || null
        });

      if (error) throw error;

      if (data) {
        // Fetch updated errors
        fetchErrors();
        
        toast({
          title: 'Success',
          description: 'Error marked as resolved',
        });
        return true;
      } else {
        toast({
          title: 'Warning',
          description: 'Error could not be resolved',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error resolving sync error:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve error',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    syncErrors,
    isLoading,
    resolveError,
    includeResolved,
    setIncludeResolved,
    refreshErrors: fetchErrors
  };
}
