
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlSyncStatus } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';

export function useGlSyncStatus(mappingId?: string) {
  const [syncStatus, setSyncStatus] = useState<GlSyncStatus | null>(null);
  const [allSyncStatuses, setAllSyncStatuses] = useState<GlSyncStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSyncStatus();
    
    // Set up a realtime subscription for sync status updates
    const channel = supabase
      .channel('gl-mapping-status-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gl_mapping_status' }, 
        () => fetchSyncStatus()
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [mappingId]);

  const fetchSyncStatus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_mapping_status')
        .select('*')
        .order('last_sync_started_at', { ascending: false });
      
      if (error) throw error;
      
      // Set all statuses
      setAllSyncStatuses(data as GlSyncStatus[]);
      
      // If mappingId is provided, find and set the specific status
      if (mappingId) {
        const statusForMapping = data.find(status => status.mapping_id === mappingId);
        setSyncStatus(statusForMapping as GlSyncStatus || null);
      } else {
        setSyncStatus(null);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch synchronization status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    syncStatus,
    allSyncStatuses,
    isLoading,
    refreshStatus: fetchSyncStatus
  };
}
