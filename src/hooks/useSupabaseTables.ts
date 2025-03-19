
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SupabaseTable {
  table_name: string;
  schema?: string;
  row_count?: number;
  has_primary_key?: boolean;
}

interface UseSupabaseTablesOptions {
  filterPrefix?: string;
  excludeViews?: boolean;
  includeRowCount?: boolean;
}

export function useSupabaseTables(options: UseSupabaseTablesOptions = {}) {
  const [tables, setTables] = useState<SupabaseTable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTables = useCallback(async (forceRefresh = false) => {
    if (tables.length > 0 && !forceRefresh) return tables;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch tables from gl_tables_view which is correctly set up
      const { data, error } = await supabase
        .from('gl_tables_view')
        .select('table_name');
      
      if (error) throw error;
      
      // Filter tables if needed
      let filteredTables = [...(data || [])];
      
      if (options.filterPrefix) {
        filteredTables = filteredTables.filter(table => 
          table.table_name.startsWith(options.filterPrefix)
        );
      }
      
      // Sort tables alphabetically
      filteredTables.sort((a, b) => a.table_name.localeCompare(b.table_name));
      
      setTables(filteredTables);
      return filteredTables;
    } catch (error) {
      console.error('Error fetching Supabase tables:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load Supabase tables: ' + errorMessage,
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [tables.length, toast, options.filterPrefix, options.excludeViews]);

  // Get table details including column information
  const getTableDetails = useCallback(async (tableName: string) => {
    try {
      const { data, error } = await supabase
        .rpc('gl_get_table_columns', { table_name: tableName });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error(`Error fetching details for table ${tableName}:`, error);
      toast({
        title: 'Error',
        description: `Failed to load table details for ${tableName}`,
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  return { 
    tables, 
    isLoading, 
    error, 
    fetchTables,
    getTableDetails
  };
}
