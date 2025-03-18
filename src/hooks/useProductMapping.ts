
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlMapping } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';

export function useProductMapping(mappingId: string) {
  const { toast } = useToast();

  const { 
    data: mapping, 
    isLoading: isMappingLoading, 
    refetch 
  } = useQuery({
    queryKey: ['glsync-mapping', mappingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gl_mappings')
        .select('*')
        .eq('id', mappingId)
        .single();
      
      if (error) throw error;
      return {
        ...data,
        column_mappings: data.column_mappings as unknown as Record<string, { 
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
    isLoading: isConnectionLoading 
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
    refetch
  };
}
