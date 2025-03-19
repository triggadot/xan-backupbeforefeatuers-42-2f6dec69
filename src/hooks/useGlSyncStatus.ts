import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlSyncStatus } from '@/types/glsync';

export function useGlSyncStatus(mappingId: string) {
  const [status, setStatus] = useState<GlSyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('gl_mapping_status')
          .select('*')
          .eq('id', mappingId)
          .single();

        if (error) {
          throw error;
        }

        const mapping = data;

        setStatus({
          id: mapping.id, // Add id
          status: mapping.current_status, // Add status field 
          connection_id: mapping.connection_id,
          glide_table: mapping.glide_table,
          glide_table_display_name: mapping.glide_table_display_name,
          supabase_table: mapping.supabase_table,
          sync_direction: mapping.sync_direction,
          enabled: mapping.enabled,
          current_status: mapping.current_status,
          last_sync_started_at: mapping.last_sync_started_at,
          last_sync_completed_at: mapping.last_sync_completed_at,
          records_processed: mapping.records_processed,
          total_records: mapping.total_records,
          error_count: mapping.error_count,
          app_name: mapping.app_name
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sync status';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();

    // Set up a real-time subscription to listen for changes
    const channel = supabase
      .channel(`gl-mapping-status-${mappingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gl_mapping_status',
          filter: `id=eq.${mappingId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            fetchStatus();
          } else if (payload.eventType === 'DELETE') {
            setStatus(null);
          }
        }
      )
      .subscribe();

    // Unsubscribe when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [mappingId]);

  return { status, isLoading, error };
}
