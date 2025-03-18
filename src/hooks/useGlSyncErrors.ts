
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlSyncRecord } from '@/types/glsync';

export function useGlSyncErrors(mappingId: string) {
  const [syncErrors, setSyncErrors] = useState<GlSyncRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchSyncErrors = useCallback(async () => {
    if (!mappingId || mappingId === ':mappingId') {
      setSyncErrors([]);
      return;
    }
    
    setIsLoading(true);
    setHasError(false);
    
    try {
      console.log('Fetching sync errors for mapping ID:', mappingId);
      const { data, error } = await supabase
        .rpc('gl_get_sync_errors', { p_mapping_id: mappingId, p_limit: 100 });
      
      if (error) {
        console.error('RPC error:', error);
        throw new Error(error.message);
      }
      
      if (!data) {
        setSyncErrors([]);
        return;
      }
      
      const formattedErrors = data.map((record: any) => ({
        type: record.error_type,
        message: record.error_message,
        record: record.record_data,
        timestamp: record.created_at,
        retryable: record.retryable
      })) as GlSyncRecord[];
      
      console.log('Sync errors:', formattedErrors);
      setSyncErrors(formattedErrors);
    } catch (error) {
      console.error('Error fetching sync errors:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [mappingId]);

  useEffect(() => {
    fetchSyncErrors();
  }, [fetchSyncErrors]);

  return {
    syncErrors,
    isLoading,
    hasError,
    refreshErrors: fetchSyncErrors
  };
}
