
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GlConnection } from '@/types/glsync';

export function useConnections() {
  const [connections, setConnections] = useState<GlConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchConnections = useCallback(async (forceRefresh = false) => {
    if (connections.length > 0 && !forceRefresh) return connections;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_connections')
        .select('id, app_name, app_id, api_key, last_sync, created_at, status, settings')
        .order('app_name', { ascending: true });
      
      if (error) throw error;
      
      // Convert the data to the expected GlConnection type
      const typedConnections: GlConnection[] = data?.map(conn => ({
        ...conn,
        settings: conn.settings as Record<string, any> | null
      })) || [];
      
      setConnections(typedConnections);
      return typedConnections;
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load connections',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [connections.length, toast]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  return { connections, isLoading, fetchConnections };
}
