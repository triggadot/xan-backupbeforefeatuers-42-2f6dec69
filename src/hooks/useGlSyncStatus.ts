import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlSyncStatus } from '@/types/glsync';

export function useGlSyncStatus() {
  const [status, setStatus] = useState<GlSyncStatus>({
    id: '', // Add required properties
    status: '',
    mapping_id: ''
  });
  const [allStatuses, setAllStatuses] = useState<GlSyncStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('gl_mapping_status')
        .select('*');
      
      if (fetchError) throw fetchError;
      
      if (data && data.length > 0) {
        // Convert the first row to GlSyncStatus type
        const firstStatus = {
          id: data[0].mapping_id || '',
          status: data[0].current_status || '',
          mapping_id: data[0].mapping_id || '',
          // Add other properties that match GlSyncStatus type
          ...data[0]
        } as GlSyncStatus;
        
        setStatus(firstStatus);
        
        // Convert all rows to GlSyncStatus type
        setAllStatuses(data.map(item => ({
          id: item.mapping_id || '',
          status: item.current_status || '',
          mapping_id: item.mapping_id || '',
          // Add other properties that match GlSyncStatus type
          ...item
        } as GlSyncStatus)));
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    
    // Set up a subscription to listen for changes
    const channel = supabase
      .channel('gl_mapping_status_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gl_mapping_status' }, 
        () => {
          fetchStatus();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStatus]);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('gl_mapping_status')
        .select('*');
      
      if (fetchError) throw fetchError;
      
      if (data && data.length > 0) {
        // Convert the first row to GlSyncStatus type
        const firstStatus = {
          id: data[0].mapping_id || '',
          status: data[0].current_status || '',
          mapping_id: data[0].mapping_id || '',
          // Add other properties that match GlSyncStatus type
          ...data[0]
        } as GlSyncStatus;
        
        setStatus(firstStatus);
        
        // Convert all rows to GlSyncStatus type
        setAllStatuses(data.map(item => ({
          id: item.mapping_id || '',
          status: item.current_status || '',
          mapping_id: item.mapping_id || '',
          // Add other properties that match GlSyncStatus type
          ...item
        } as GlSyncStatus)));
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    status,
    allStatuses,
    isLoading,
    error,
    refetch
  };
}
