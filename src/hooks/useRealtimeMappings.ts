
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlMapping } from '@/types/glsync';
import { Mapping } from '@/types/syncLog';
import { convertToGlMapping } from '@/utils/gl-mapping-converters';
import { useToast } from '@/hooks/use-toast';

export function useRealtimeMappings() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMappings();

    // Subscribe to changes on the gl_mappings table
    const channel = supabase
      .channel('gl-mappings-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gl_mappings' }, 
        () => fetchMappings()
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMappings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_mappings')
        .select(`
          id,
          connection_id,
          glide_table,
          glide_table_display_name,
          supabase_table,
          column_mappings,
          sync_direction,
          enabled,
          created_at,
          updated_at,
          gl_connections(app_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to match the Mapping type
      const formattedMappings = data.map(item => ({
        ...item,
        app_name: item.gl_connections?.app_name || null
      })) as Mapping[];
      
      setMappings(formattedMappings);
    } catch (error) {
      console.error('Error fetching mappings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch mappings.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEnabled = async (mapping: Mapping) => {
    try {
      const { error } = await supabase
        .from('gl_mappings')
        .update({ enabled: !mapping.enabled })
        .eq('id', mapping.id);
      
      if (error) throw error;
      
      // Optimistically update state
      setMappings(prev => 
        prev.map(m => 
          m.id === mapping.id ? { ...m, enabled: !m.enabled } : m
        )
      );
      
      toast({
        title: 'Success',
        description: `Mapping ${!mapping.enabled ? 'enabled' : 'disabled'} successfully.`,
      });
    } catch (error) {
      console.error('Error toggling mapping:', error);
      toast({
        title: 'Error',
        description: 'Failed to update mapping.',
        variant: 'destructive',
      });
    }
  };

  const deleteMapping = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gl_mappings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Optimistically update state
      setMappings(prev => prev.filter(m => m.id !== id));
      
      toast({
        title: 'Success',
        description: 'Mapping deleted successfully.',
      });

      return true;
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete mapping.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    mappings,
    isLoading,
    toggleEnabled,
    deleteMapping,
    refreshMappings: fetchMappings
  };
}
