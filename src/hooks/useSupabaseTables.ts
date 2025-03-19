
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SupabaseTable {
  table_name: string;
}

export function useSupabaseTables() {
  const [tables, setTables] = useState<SupabaseTable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchTables = useCallback(async (forceRefresh = false) => {
    if (tables.length > 0 && !forceRefresh) return tables;
    
    setIsLoading(true);
    try {
      // Use the correct information_schema reference (no public_ prefix)
      const { data, error } = await supabase
        .from('gl_tables_view')
        .select('table_name');
      
      if (error) throw error;
      setTables(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching Supabase tables:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Supabase tables',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [tables.length, toast]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  return { tables, isLoading, fetchTables };
}
