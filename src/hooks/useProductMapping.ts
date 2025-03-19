
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlMapping } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';
import { convertToGlMapping } from '@/utils/gl-mapping-converters';

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
      
      const { data, error } = await supabase
        .from('gl_mappings')
        .select('*')
        .eq('id', mappingId)
        .single();
      
      if (error) {
        console.error('Error fetching mapping:', error);
        throw error;
      }
      
      if (!data) {
        console.warn('No mapping data found for ID:', mappingId);
        throw new Error('Mapping not found');
      }
      
      console.log('Raw mapping data:', data);
      
      // Convert the raw data to a properly typed GlMapping using the converter utility
      return convertToGlMapping(data);
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
      const { data, error } = await supabase
        .from('gl_connections')
        .select('*')
        .eq('id', mapping?.connection_id!)
        .single();
      
      if (error) throw error;
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
