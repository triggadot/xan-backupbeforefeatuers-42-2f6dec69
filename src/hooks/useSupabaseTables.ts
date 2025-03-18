
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseTable } from '@/types/syncLog';

export function useSupabaseTables() {
  const [tables, setTables] = useState<SupabaseTable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('gl_tables_view')
        .select('*')
        .order('table_name');
      
      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching tables');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  return {
    tables,
    isLoading,
    error,
    fetchTables,
  };
}
