import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlMapping } from '@/types/glsync';
import { useToast } from '@/hooks/utils/use-toast';

/**
 * Hook for fetching and subscribing to real-time mapping data
 * 
 * @returns Object containing mappings data, loading state, and refresh function
 */
export function useRealtimeMappings() {
  const [mappings, setMappings] = useState<GlMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Fetches all mappings from the database
   */
  const fetchMappings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('gl_mappings')
        .select('*, gl_connections(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setMappings(data as GlMapping[]);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error fetching mappings',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Sets up a real-time subscription to the gl_mappings table
   */
  const setupRealtimeSubscription = useCallback(() => {
    const subscription = supabase
      .channel('gl_mappings_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'gl_mappings' 
        }, 
        () => {
          fetchMappings();
        }
      )
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchMappings]);

  // Initial fetch and setup subscription
  useEffect(() => {
    fetchMappings();
    const cleanup = setupRealtimeSubscription();
    
    return cleanup;
  }, [fetchMappings, setupRealtimeSubscription]);

  /**
   * Manually refresh mappings data
   */
  const refreshMappings = () => {
    fetchMappings();
  };

  return {
    mappings,
    isLoading,
    error,
    refreshMappings
  };
}
