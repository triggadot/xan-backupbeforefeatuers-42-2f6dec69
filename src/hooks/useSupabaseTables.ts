import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

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

export function useSupabaseTables() {
  const [tables, setTables] = useState<SupabaseTable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchTables = useCallback(async (forceRefresh = false) => {
    if (tables.length > 0 && !forceRefresh) return tables;
    
    setIsLoading(true);
    try {
      // Use hardcoded tables for reliability
      console.log('Using predefined core tables');
      setTables(CORE_GL_TABLES);
      return CORE_GL_TABLES;
    } catch (error) {
      console.error('Error in useSupabaseTables:', error);
      
      // Fallback to hardcoded core tables if any error occurs
      setTables(CORE_GL_TABLES);
      
      toast({
        title: 'Notice',
        description: 'Using default table list',
        variant: 'default',
      });
      
      return CORE_GL_TABLES;
    } finally {
      setIsLoading(false);
    }
  }, [tables.length, toast]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  return { tables, isLoading, fetchTables };
}
