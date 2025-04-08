import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/utils/use-toast';
import { supabase } from '@/integrations/supabase/client';

/**
 * Interface representing a Supabase table
 * @interface SupabaseTable
 * @property {string} table_name - The name of the table in the database
 */
interface SupabaseTable {
  table_name: string;
}

// Define core Glide tables
const CORE_GL_TABLES: SupabaseTable[] = [
  { table_name: 'gl_accounts' },
  { table_name: 'gl_customer_credits' },
  { table_name: 'gl_customer_payments' },
  { table_name: 'gl_estimate_lines' },
  { table_name: 'gl_estimates' },
  { table_name: 'gl_expenses' },
  { table_name: 'gl_invoice_lines' },
  { table_name: 'gl_invoices' },
  { table_name: 'gl_products' },
  { table_name: 'gl_purchase_orders' },
  { table_name: 'gl_shipping_records' },
  { table_name: 'gl_vendor_payments' }
];

/**
 * Hook for fetching Supabase tables available for sync operations
 * 
 * @returns {Object} Object containing tables, loading state, and fetch function
 * @property {SupabaseTable[]} tables - List of available Supabase tables
 * @property {boolean} isLoading - Whether tables are currently being fetched
 * @property {Function} fetchTables - Function to manually trigger a refresh of tables
 * 
 * @example
 * ```tsx
 * const { tables, isLoading, fetchTables } = useSupabaseTables();
 * 
 * // Force refresh tables
 * const handleRefresh = () => {
 *   fetchTables(true);
 * };
 * ```
 */
export function useSupabaseTables() {
  const [tables, setTables] = useState<SupabaseTable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchTables = useCallback(async (forceRefresh = false) => {
    if (tables.length > 0 && !forceRefresh) return tables;
    
    setIsLoading(true);
    
    try {
      // Use core tables as a fallback
      let fetchedTables = [...CORE_GL_TABLES];
      
      // Try to fetch tables from database
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .not('table_name', 'like', 'pg_%')
        .not('table_name', 'like', 'auth_%')
        .not('table_name', 'like', 'storage_%')
        .not('table_name', 'like', 'supabase_%')
        .order('table_name');
      
      if (error) {
        console.error('Error in useSupabaseTables:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        fetchedTables = data;
      }
      
      setTables(fetchedTables);
      return fetchedTables;
    } catch (error) {
      toast({
        title: 'Error fetching tables',
        description: error.message,
        variant: 'destructive',
      });
      return CORE_GL_TABLES;
    } finally {
      setIsLoading(false);
    }
  }, [tables, toast]);

  // Fetch tables on initial mount
  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  return {
    tables,
    isLoading,
    fetchTables,
  };
}
