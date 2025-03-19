
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlMapping } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';

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
      const { data, error } = await supabase
        .from('gl_mappings')
        .select('*')
        .eq('id', mappingId)
        .single();
      
      if (error) {
        console.error('Error fetching mapping:', error);
        throw error;
      }
      
      if (!data || !data.column_mappings) {
        console.warn('Missing column_mappings in data:', data);
        throw new Error('Column mappings data not available');
      }
      
      console.log('Raw mapping data:', data);
      
      // Ensure column_mappings is properly parsed if it's a string
      let parsedColumnMappings = data.column_mappings;
      if (typeof data.column_mappings === 'string') {
        try {
          parsedColumnMappings = JSON.parse(data.column_mappings);
        } catch (e) {
          console.error('Error parsing column_mappings:', e);
          throw new Error('Invalid column mappings format');
        }
      }
      
      return {
        ...data,
        column_mappings: parsedColumnMappings as Record<string, { 
          glide_column_name: string;
          supabase_column_name: string;
          data_type: 'string' | 'number' | 'boolean' | 'date-time' | 'image-uri' | 'email-address';
        }>
      } as GlMapping;
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
