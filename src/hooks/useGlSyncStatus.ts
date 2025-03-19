
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlSyncStatus } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';

export const useGlSyncStatus = (mappingId?: string) => {
  const [status, setStatus] = useState<GlSyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStatus = async () => {
    if (!mappingId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('gl_mapping_status')
        .select('*')
        .eq('mapping_id', mappingId)
        .single();

      if (error) throw error;

      if (data) {
        const syncStatus: GlSyncStatus = {
          id: data.mapping_id,
          mapping_id: data.mapping_id,
          status: data.current_status || 'pending',
          last_sync: data.last_sync_completed_at,
          records_processed: data.records_processed,
          total_records: data.total_records,
          error_count: data.error_count,
          current_status: data.current_status,
          last_sync_started_at: data.last_sync_started_at,
          last_sync_completed_at: data.last_sync_completed_at,
          connection_id: data.connection_id,
          glide_table: data.glide_table,
          glide_table_display_name: data.glide_table_display_name,
          supabase_table: data.supabase_table,
          app_name: data.app_name,
          enabled: data.enabled,
          sync_direction: data.sync_direction
        };
        
        setStatus(syncStatus);
      } else {
        setStatus(null);
      }
    } catch (err) {
      console.error('Error fetching sync status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      toast({
        title: 'Error',
        description: 'Failed to load sync status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('gl_mapping_status_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'gl_mappings',
          filter: mappingId ? `id=eq.${mappingId}` : undefined
        }, 
        () => {
          fetchStatus();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'gl_sync_logs',
          filter: mappingId ? `mapping_id=eq.${mappingId}` : undefined
        }, 
        () => {
          fetchStatus();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [mappingId]);

  return { status, isLoading, error, refetch: fetchStatus };
};
