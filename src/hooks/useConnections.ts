
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
        .select('*')
        .order('app_name', { ascending: true });
      
      if (error) throw error;
      setConnections(data || []);
      return data || [];
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
  }, []);

  return { connections, isLoading, fetchConnections };
}
