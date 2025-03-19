
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlMapping } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';
import { convertToGlMapping } from '@/utils/gl-mapping-converters';
import { Mapping } from '@/types/syncLog';

export function useProductMapping(mappingId: string) {
  const { toast } = useToast();

  const { 
    data: mapping, 
    isLoading: isMappingLoading,
    error: mappingError,
    refetch 
  } = useQuery({
    queryKey: ['glsync-mapping', mappingId],
    queryFn: async () => {
      console.log(`Fetching mapping with ID: ${mappingId}`);
      
      if (!mappingId || mappingId === ':mappingId') {
        throw new Error('Invalid mapping ID');
      }
      
      // Using maybeSingle() instead of single() to handle the case of no results
      const { data, error } = await supabase
        .from('gl_mappings')
        .select('*')
        .eq('id', mappingId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching mapping:', error);
        throw error;
      }
      
      if (!data) {
        console.warn('No mapping data found for ID:', mappingId);
        throw new Error('Mapping not found');
      }
      
      console.log('Raw mapping data:', data);
      
      // Prepare mapping for conversion
      const rawMapping: Mapping = {
        id: data.id,
        connection_id: data.connection_id,
        glide_table: data.glide_table,
        glide_table_display_name: data.glide_table_display_name,
        supabase_table: data.supabase_table,
        column_mappings: typeof data.column_mappings === 'string' 
          ? JSON.parse(data.column_mappings) 
          : data.column_mappings,
        sync_direction: data.sync_direction as "to_supabase" | "to_glide" | "both",
        enabled: data.enabled,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      // Convert the raw data to a properly typed GlMapping using the converter utility
      return convertToGlMapping(rawMapping);
    },
    enabled: !!mappingId && mappingId !== ':mappingId',
    meta: {
      onError: (error: any) => {
        console.error('Error fetching mapping:', error);
        toast({
          title: 'Error fetching mapping',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  });

  const { 
    data: connection, 
    isLoading: isConnectionLoading,
    error: connectionError
  } = useQuery({
    queryKey: ['glsync-connection', mapping?.connection_id],
    queryFn: async () => {
      // Using maybeSingle() instead of single() to handle potential multiple or no results
      const { data, error } = await supabase
        .from('gl_connections')
        .select('*')
        .eq('id', mapping?.connection_id!)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error(`Connection not found with ID: ${mapping?.connection_id}`);
      
      return data;
    },
    enabled: !!mapping?.connection_id,
    meta: {
      onError: (error: any) => {
        console.error('Error fetching connection:', error);
        toast({
          title: 'Error fetching connection',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  });

  return {
    mapping,
    connection,
    isLoading: isMappingLoading || isConnectionLoading,
    error: mappingError ? (mappingError as Error).message : connectionError ? (connectionError as Error).message : undefined,
    refetch
  };
}
