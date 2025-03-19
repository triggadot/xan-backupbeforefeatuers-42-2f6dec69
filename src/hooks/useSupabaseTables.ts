
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupabaseTable {
  table_name: string;
}

export const useSupabaseTables = () => {
  const [tables, setTables] = useState<SupabaseTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTables = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('gl_tables_view')
        .select('*');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data) {
        // Filter out system tables and properly type table_name as string
        const filteredTables = data
          .filter(table => {
            const tableName = String(table.table_name);
            return !tableName.startsWith('_') && 
                   !tableName.startsWith('pg_') && 
                   !tableName.startsWith('auth.');
          })
          .map(table => ({ 
            table_name: String(table.table_name) 
          }))
          .sort((a, b) => a.table_name.localeCompare(b.table_name));
        
        setTables(filteredTables);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTables();
  }, []);
  
  return { tables, isLoading, error, fetchTables };
};
