import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define the valid table names
type TableName = 
  | 'gl_accounts' 
  | 'gl_connections' 
  | 'gl_customer_credits' 
  | 'gl_customer_payments'
  | 'gl_estimate_lines'
  | 'gl_estimates'
  | 'gl_expenses'
  | 'gl_invoice_lines'
  | 'gl_invoices'
  | 'gl_mappings'
  | 'gl_products'
  | 'gl_purchase_orders'
  | 'gl_shipping_records'
  | 'gl_sync_errors'
  | 'gl_sync_logs'
  | 'gl_vendor_payments'
  | 'messages'
  | 'profiles'
  | 'settings'
  | 'gl_mapping_status' // view
  | 'gl_product_sync_stats' // view
  | 'gl_recent_logs' // view
  | 'gl_sync_stats' // view
  | 'gl_tables_view'; // view

/**
 * Hook for interacting with Supabase tables with CRUD operations
 * @param tableName The Supabase table to operate on
 */
export function useTableData<T extends Record<string, unknown>>(tableName: TableName) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!tableName) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Need to use type assertion since Supabase types are strictly typed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*');
      
      if (error) throw error;
      
      // Cast to the generic type
      setData(data as unknown as T[]);
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [tableName, toast]);

  const createRecord = useCallback(async (record: Omit<T, 'id'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Need to use type assertion since Supabase types are strictly typed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase
        .from(tableName as any)
        .insert(record)
        .select();
      
      if (error) throw error;
      
      setData(prev => [...prev, ...(data as unknown as T[])]);
      toast({
        title: 'Success',
        description: 'Record created successfully',
      });
      
      return data?.[0];
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create record';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [tableName, toast]);

  const updateRecord = useCallback(async (id: string, record: Partial<T>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Need to use type assertion since Supabase types are strictly typed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase
        .from(tableName as any)
        .update(record)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      setData(prev => prev.map(item => {
        const typedItem = item as T & { id: string };
        if (typedItem.id === id) {
          return { ...typedItem, ...record } as T;
        }
        return item;
      }));
      
      toast({
        title: 'Success',
        description: 'Record updated successfully',
      });
      
      return data?.[0];
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update record';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [tableName, toast]);

  const deleteRecord = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Need to use type assertion since Supabase types are strictly typed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setData(prev => prev.filter(item => {
        const typedItem = item as T & { id: string };
        return typedItem.id !== id;
      }));
      
      toast({
        title: 'Success',
        description: 'Record deleted successfully',
      });
      
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete record';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [tableName, toast]);

  return {
    data,
    isLoading,
    error,
    fetchData,
    createRecord,
    updateRecord,
    deleteRecord
  };
}
