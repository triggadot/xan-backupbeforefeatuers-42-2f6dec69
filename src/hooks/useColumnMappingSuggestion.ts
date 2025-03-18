
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ColumnMappingSuggestion } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';

export function useColumnMappingSuggestion() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ColumnMappingSuggestion[]>([]);
  const { toast } = useToast();

  const getSuggestions = async (supabaseTable: string, glideColumns: any[]): Promise<ColumnMappingSuggestion[]> => {
    if (!supabaseTable || !glideColumns || glideColumns.length === 0) {
      return [];
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('gl_suggest_column_mappings', { 
          p_supabase_table: supabaseTable,
          p_glide_columns: JSON.stringify(glideColumns)
        });
      
      if (error) {
        throw error;
      }
      
      const mappingSuggestions = data || [];
      setSuggestions(mappingSuggestions);
      return mappingSuggestions;
    } catch (error) {
      console.error('Error getting column mapping suggestions:', error);
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get column mapping suggestions',
        variant: 'destructive',
      });
      
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getSuggestions,
    isLoading,
    suggestions
  };
}
